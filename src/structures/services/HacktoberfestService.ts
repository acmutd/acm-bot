import { Message, DMChannel, MessageEmbed, MessageReaction, User, VoiceChannel } from 'discord.js';
import ACMClient from '../Bot';
import Command from '../Command';
import { settings } from '../../botsettings';
import { FieldValue } from '@google-cloud/firestore';

export default class HacktoberfestService {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }

    /**
     * This will run when a reaction changes.
     */
    async handleReactionAdd(reaction: MessageReaction, user: User) {
        let reactionEvent = this.client.indicators.getValue('reactionEvent', reaction.message.channel.id);
        if (!reactionEvent || 
            reaction.emoji.id != reactionEvent.reactionId ||
            user.id != reactionEvent.moderatorId) return;
        
        await this.client.services.hacktoberfest.awardPoints(reactionEvent.points, reactionEvent.activityId, new Set<string>([reaction.message.author.id]));
    }
    
    startReactionEvent(channelId: string, activityId: string, reactionId: string, moderatorId: string, points: number) {
        if (this.client.indicators.hasKey('reactionEvent', channelId)) return false;
        
        this.client.indicators.setKeyValue('reactionEvent', channelId, {channelId, activityId, reactionId, moderatorId, points});
        return true;
    }
    
    stopReactionEvent(channelId: string) {
        if (!this.client.indicators.hasKey('reactionEvent', channelId)) return false;
        
        this.client.indicators.removeKey('reactionEvent', channelId);
        return true;
    }

    startVoiceEvent(voiceChannel: VoiceChannel, activityId: string, moderatorId: string, points: number) {
        let attendees = new Set<string>();

        if (this.client.indicators.hasKey('voiceEvent', voiceChannel.id)) return false; // event already running in this channel

        // add non-bot users to the attendance set
        for (const [, member] of voiceChannel.members) {
            if (member.user.bot) continue;
            attendees.add(member.id);
        }

        this.client.indicators.setKeyValue('voiceEvent', voiceChannel.id, {attendees, activityId, moderatorId, points});
        return true;
    }

    stopVoiceEvent(voiceChannel: VoiceChannel) {
        let voiceEvent = this.client.indicators.getValue('voiceEvent', voiceChannel.id);
        let originalAttendees: Set<string>;
        let trueAttendees = new Set<string>();

        if (!voiceEvent) return; // no event running in this channel

        // pull attendees into a separate variable to work with
        originalAttendees = voiceEvent.attendees as Set<string>;;

        // we can disable this voice event now
        this.client.indicators.removeKey('voiceEvent', voiceChannel.id);

        // populate trueAttendees with only those who were there in the beginning and the end
        for (const [snowflake, member] of voiceChannel.members) {
            if (member.user.bot) continue;
            if (originalAttendees.has(snowflake)) {
                trueAttendees.add(snowflake);
            }
        }

        voiceEvent.attendees = trueAttendees;

        return voiceEvent;
        
        // now let's award all of these dedicated attendees
        //return this.client.services.hacktoberfest.awardPoints(voiceEvent.points, voiceEvent.activityId, trueAttendees);
    }

    /**
     * Increments points for many users
     * @param points 
     * @param activity 
     * @param awardees 
     */
    async awardPoints(points: number, activity: string, awardees: Set<string>) {
        let success: string[] = [];
        let failure: string[] = [];

        let activities = {};

        // incrementor
        const increment = FieldValue.increment(points);

        // increment points on firestore
        for (let userId of awardees.values()) {
            try {
                let docRef = this.client.firestore.firestore?.collection("htf_leaderboard/snowflake_to_all/mapping").doc(userId);
                await docRef?.get().then(async (doc) => {
                    if (!doc.exists) {
                        throw new Error(`User with ID ${userId} does not exist!`);
                    }

                    // update the main points storage
                    let activities: any = doc.data()?.activities;
                    if (!activities) {
                        activities = {
                            [activity]: points
                        }
                    }
                    else {
                        activities[activity] = (activities.hasOwnProperty(activity) ? activities[activity]+points : points);
                    }
                    
                    await docRef?.update({
                        points: increment,
                        activities: activities,
                    });
                    // add ledger entry
                    await this.client.firestore.firestore?.collection("htf_leaderboard/transactions/ledger").add({
                        created_at: FieldValue.serverTimestamp(),
                        name: doc.data()?.name,
                        reason: activity,
                        change: points,
                        new_points: doc.data()?.points + points,
                    });
                })

                success.push(`<@${userId}>`);
            }
            catch (error) {
                failure.push(`<@${userId}>`);
            }
        }
        console.log(`Awarded ${points} points to ${success.length}/${awardees.size} users for ${activity}`);
        return {success, failure};
    }

    /**
     * Function for retrieving data for user from firestore
     */
    async getData(userId: string) {
        let exists: boolean | undefined;
        let data: FirebaseFirestore.DocumentData | undefined;
        await this.client.firestore.firestore?.collection("htf_leaderboard/snowflake_to_all/mapping").doc(userId).get().then(async (doc) => {
            exists = doc.exists;
            data = doc.data();
        });
        return {
            exists, 
            data
        }
    }

    /**
     * Function for getting snowflake from email address
     */
    async emailsToSnowflakes(emails: Set<string>): Promise<string[] | null> {
        let snowflakes: string[] = [];
        await this.client.firestore.firestore?.collection("htf_leaderboard").doc("email_to_snowflake").get().then(async (doc) => {
            if (!doc.exists || !doc.data()) return null;

            let data = doc.data()!;

            for (let email of emails.values()) {
                if (email in doc.data()!) {
                    snowflakes.push(data[email]);
                }
            }
            return snowflakes;
        });
        return snowflakes;
    }
}
