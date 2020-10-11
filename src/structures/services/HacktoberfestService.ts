import { Message, DMChannel, MessageEmbed } from 'discord.js';
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
    async handleReaction(msg: Message) {

    }

    /**
     * Function for handling point changes
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

}
