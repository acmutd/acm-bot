import { Message, DMChannel, MessageEmbed, MessageReaction, User, VoiceChannel, Collection, TextChannel } from 'discord.js';
import ACMClient from '../Bot';
import Command from '../Command';
import { settings } from '../../botsettings';
import { FieldValue } from '@google-cloud/firestore';
import { stringify } from 'uuid';

interface UserPointsData {
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    tag: string;
    snowflake?: string;
    points?: number;
    activities?: any;
}

interface PairPointsData {
    mentorData: UserPointsData;
    menteeData: UserPointsData;
    points: number; 
}

export default class PointsSystemService {
    public client: ACMClient;
    privateChannelId: string;
    publicChannelId: string;
    staffRoleId: string;
    

    constructor(client: ACMClient) {
        this.client = client;
        this.privateChannelId = settings.points.privateChannel;
        this.publicChannelId = settings.points.publicChannel;
        this.staffRoleId = settings.points.staffRole;
    }

    //
    // Event monitoring and handling //
    //


    /**
     * This will run when a reaction changes.
     */
    async handleReactionAdd(reaction: MessageReaction, user: User) {
        // fetch everything to ensure all the data is complete
        if (reaction.partial) await reaction.fetch();
        await reaction.users.fetch();
        const msg = await reaction.message.fetch();

        // resolve user into guild member (so that we can check their roles later)
        const ACMGuild = await this.client.guilds.fetch(settings.guild);
        const member = await ACMGuild.members.fetch(user.id);

        // regex to parse encoded data
        const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;

        // Ignore if the message isn't something we care about
        if (user.id === this.client.user?.id ||                 // bot is the one who reacted
            msg.channel.id !== this.privateChannelId ||         // wrong channel
            msg.author.id !== this.client.user?.id ||           // author is not bot
            !reaction.users.cache.has(this.client.user?.id) ||  // bot check mark react is not there
            reaction.emoji.name !== "✅" ||                     // wrong emote
            msg.embeds.length !== 1 ||                          // # of embeds not 1
            !msg.embeds[0].title ||                             // no title
            !msg.embeds[0].title!.startsWith("Response for") || // wrong title
            !msg.embeds[0].description ||                       // no description
            !re.test(msg.embeds[0].description)                 // desc doesn't contain our embedded data

        )
            return;

        // If reactor is not a mod, remove their reaction and rat them out.
        if (!member.roles.cache.has(this.staffRoleId)) {
            reaction.users.remove(user.id);
            return this.client.response.emit(
                msg.channel,
                `${user}, you are not authorized to approve points!`,
                "invalid"
            )
        }

        // Award the points, clear reactions, react with 🎉, print success
        const encodedData = JSON.parse(decodeURIComponent(msg.embeds[0].description.match(re)![1]))
        this.awardPoints(encodedData.points, encodedData.activity, new Set<string>([encodedData.snowflake]));
        reaction.message.reactions.removeAll()
            .then(() => reaction.message.react("🎉"));
        return this.client.response.emit(
            msg.channel,
            `${user} has approved \`${encodedData.activity}\` for <@${encodedData.snowflake}>!`,
            "success"
        )
            
            
        /*
        let reactionEvent = this.client.indicators.getValue('reactionEvent', reaction.message.channel.id);
        if (!reactionEvent || 
            reaction.emoji.id != reactionEvent.reactionId ||
            user.id != reactionEvent.moderatorId) return;
        
        await this.client.services.points.awardPoints(reactionEvent.points, reactionEvent.activityId, new Set<string>([reaction.message.author.id]));
        */
    }

    /**
     * Handles a json from typeform webhook (should be called by the /points-form endpoint handler)
     * @param typeformData unaltered, posted JSON from typeform webhook
     */
    async handlePointsTypeform(typeformData: any) {
        const pointsToAdd: number = typeformData.form_response.calculated.score;
        const title: string = typeformData.form_response.definition.title;


        /* a bunch of logic thats more work than is worth rn
        const response: Map<string, string> = new Map<string, string>();
        typeformData.form_response.definition.fields.forEach( (field: any, index: number) => {
            const title: string = field.title;
            const answer_type: string = typeformData.form_response.answers[index].type;
            let answer: string | undefined;

            switch(answer_type) {
                case 'text':
                case 'email':
                case 'date':
                case 'url':
                case 'file_url':
                    answer = typeformData.form_response.answers[index][answer_type]
                    break
                case 'choice':
                    answer = typeformData.form_response.answers[index].choice.label
                    break
                default:
                    this.client.logger.warn(`Unhandled typeform answer type: '${answer_type}'`);
            }

            if (answer !== undefined) {
                response.set(title, answer);
            }
        })

        // at this point, we have our typeform q/a all nice and tidy.

        let firstName, lastName, email, event, evidence: string = '';
        for (const [q, a] of response) {
            if (q.search("first name")) firstName = a;
            else if (q.search("last name")) lastName = a;
            else if (q.search("email address")) email = a;
            else if (q.search("event did u attend")) event = a;
            else if (q.search("evidence")) evidence = a;
        }

        const confirmationChannel = (await this.client.channels.fetch(this.confirmationChannelId)) as TextChannel
        await confirmationChannel.send(new MessageEmbed({
            title: `Response for ${firstName} ${lastName} (${email})`,
            description: event,
            image: {
                url: evidence,
            }
        }))
        */

        const answers: any = typeformData.form_response.answers;
        const confirmationChannel = (await this.client.channels.fetch(this.privateChannelId)) as TextChannel;

        // fetch user data
        const resolvedSnowflakes: string[] = await this.emailsToSnowflakes(new Set<string>([answers[0].email]))

        // handle user not resolvable based on email
        if (resolvedSnowflakes.length == 0)
            return this.client.response.emit(
                confirmationChannel,
                `⚠ **Submission received for \`${title}\`with unregistered email**: \`${answers[0].email}\``,
                'warning'
            )
        
        const userData = await this.getUser(resolvedSnowflakes[0]) as UserPointsData;
        const encodedData = {
            snowflake: userData.snowflake,
            activity: answers[1].choice.label,
            points: pointsToAdd,
        };
        
        const message = await confirmationChannel.send(new MessageEmbed({
            title: `Response for ${userData.full_name}`,
            description: 
                // we'll sneakily hide some data here :)
                `[\u200B](http://fake.fake?data=${encodeURIComponent(JSON.stringify(encodedData))})` +
                `**Discord**: <@${userData.snowflake}>\n` + 
                `**Email**: \`${userData.email}\`\n` +     
                `**Activity**: \`${answers[1].choice.label}\`\n` +
                `**Proof**:`,
            image: {
                url: answers[2].file_url,
            },
            footer: {
                text: `${pointsToAdd} points will be awarded upon approval.`
            }
        }));

        await message.react("✅");
    }

    async handleRegistrationTypeform(typeformData: any) {
        const answers: any = typeformData.form_response.answers;

        // data objects to pass into firestore
        let mentorData: UserPointsData = {
            first_name: answers[0].text,
            last_name: answers[1].text,
            full_name: answers[0].text + ' ' + answers[1].text,
            email: answers[2].email,
            tag: answers[3].text,
        }

        let menteeData: UserPointsData = {
            first_name: answers[4].text,
            last_name: answers[5].text,
            full_name: answers[4].text + ' ' + answers[5].text,
            email: answers[6].email,
            tag: answers[7].text,
        }

        // send both users off to be registered
        const mentorSnowflake = await this.registerUser(mentorData);
        const menteeSnowflake = await this.registerUser(menteeData, false);

        // finally, link the two profiles together
        if (mentorSnowflake && menteeSnowflake)
            await this.client.firestore.firestore?.collection("points_system")
                .doc('pairs')
                .set({
                    [menteeSnowflake]: mentorSnowflake
                }, {merge: true});
    }

    async registerUser(data: UserPointsData, notify: boolean = true) {
        const notifChannel = (await this.client.channels.fetch(this.privateChannelId)) as TextChannel;
        const ACMGuild = await this.client.guilds.fetch(settings.guild);
        if (!ACMGuild) return;

        // use the user resolver on most lenient settings
        const user = await this.client.services.resolver.ResolveGuildUser(
            data.tag,
            ACMGuild,
            new Set<string>(['tag']),
            true
        );

        // handle user not found
        if (!user) {
            notifChannel.send(`Err: Couldn't find user called "${data.tag}" (${data.full_name})`);
            return;
        }

        // now that we have the user, we can set their snowflake and fix their tag
        data.snowflake = user.id;
        data.tag = user.tag;

        // maybe they just want to update info. If that's the case, don't overwrite their points! (so we use merge true)
        await this.client.firestore.firestore?.collection("points_system/users/profiles")
            .doc(data.snowflake)
            .set(data, { merge: true });

        // also map the email to snowflake so we find them later
        await this.client.firestore.firestore?.collection("points_system")
            .doc('email_to_discord')
            .set({[data.email]: data.snowflake}, {merge: true});

        // send confirmation
        if (notify)
            await user.send(new MessageEmbed({
                color: '#EC7621',
                title: 'Mentor/Mentee Registration Confirmed',
                description: `Hi **${data.full_name}**, thank you for registering!\n`,
                footer: {
                    text: 'If you did not recently request this action, please contact an ACM staff member.',
                },
            })).catch(
                (e) => notifChannel.send(`DMs are off for "${data.tag}" (${data.full_name})`)
            )

        return data.snowflake;
    }

    async handleGenericTypeform(typeformData: any) {
        const pointsToAdd: number = typeformData.form_response.calculated.score;
        const answers: any = typeformData.form_response.answers;
        const errChannel = (await this.client.channels.fetch(this.privateChannelId)) as TextChannel;
        const title: string = typeformData.form_response.definition.title;

        // fetch user's snowflake
        const resolvedSnowflakes: string[] = await this.emailsToSnowflakes(new Set<string>([answers[0].email]))

        // handle user not resolvable based on email
        if (resolvedSnowflakes.length == 0)
            return this.client.response.emit(
                errChannel,
                `⚠ **Submission received for \`${title}\`with unregistered email**: \`${answers[0].email}\``,
                'warning'
            )
        
        // award points
        await this.awardPoints(
            pointsToAdd, 
            title, 
            new Set<string>([resolvedSnowflakes[0]])
        );
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
    }

    //
    // Firestore interaction section //
    //

    /**
     * Increments points for many users
     * @param points 
     * @param activity 
     * @param awardees set of snowflakes
     */
    async awardPoints(points: number, activity: string, awardees: Set<string>) {
        let success: string[] = [];
        let failure: string[] = [];

        let activities = {};

        // incrementor
        const increment = FieldValue.increment(points);

        // increment points on firestore
        for (let snowflake of awardees.values()) {
            const docRef = this.client.firestore.firestore?.collection("points_system/users/profiles").doc(snowflake);
            const doc = await docRef?.get();

            // handle doc doesn't exist
            if (doc == undefined || !doc.exists) {
                failure.push(`<@${snowflake}>`);
                continue;
            }

            // modify the doc data
            let userData = doc.data()! as UserPointsData;
            // add activity
            if (!userData.activities) {
                userData.activities = {
                    [activity]: points
                }
            }
            else {
                userData.activities[activity] = (userData.activities[activity] || 0) + points;
            }
            userData.points = (userData.points || 0) + points;

            await docRef?.set(userData);
            success.push(`<@${snowflake}>`);
        }

        if (activity != 'Discord') {
            // push update to log channel if not for general activity
            const logChannel = await this.client.channels.fetch(this.publicChannelId) as TextChannel;
            if (success.length < 60)
                logChannel.send(
                    `Awarded ${points} points to ${success.join(', ')} for ${activity}!`,
                    {"allowedMentions": { "users" : []}}
                );
            else
                logChannel.send(
                    `Awarded ${points} points to ${success.length} users for ${activity}!`,
                    {"allowedMentions": { "users" : []}}
                );
        }

        console.log(`Awarded ${points} points to ${success.length}/${awardees.size} users for ${activity}`);
        return {success, failure};
    }

    /**
     * Function for retrieving data for user from firestore
     */
    async getUser(snowflake: string) {
        let exists: boolean | undefined;
        let data: UserPointsData | undefined;
        await this.client.firestore.firestore?.collection("points_system/users/profiles")
            .doc(snowflake)
            .get().then(async (doc) => {
                exists = doc.exists;
                data = doc.data() as UserPointsData;
            });
        if (data != undefined && data.points == undefined)
            data.points = 0;

        return data;
    }

    /**
     * Get snowflakes from email addresses
     */
    async emailsToSnowflakes(emails: Set<string>): Promise<string[]> {
        let snowflakes: string[] = [];
        await this.client.firestore.firestore?.collection("points_system")
                .doc("email_to_discord")
                .get().then(async (doc) => {
            if (!doc.exists || !doc.data()) return [];

            let data = doc.data()!;

            for (let email of emails.values()) {
                if (email in doc.data()!) {
                    snowflakes.push(data[email]);
                }
            }
        });
        return snowflakes;
    }

    /**
     * Retrieve the user list. Could be expensive!
     * @param limit Number of users to return
     */
    async getLeaderboard(limit = 0) {
        let res: PairPointsData[] = [];

        // build a map of individual data, keyed by ID
        let individualData: Map<string, UserPointsData> = new Map<string, UserPointsData>();
        let snapshot = await this.client.firestore.firestore?.collection("points_system/users/profiles").get();
        snapshot?.forEach( (doc) => {
            individualData.set(doc.id, doc.data() as UserPointsData);
        });

        // create mapping of mentor+mentee → combined points
        let pairs = await (await this.client.firestore.firestore?.collection("points_system").doc("pairs").get()!).data();

        for (const menteeSnowflake in pairs) {
            const mentorData = individualData.get(pairs[menteeSnowflake]);
            const menteeData = individualData.get(menteeSnowflake);

            if (!mentorData || !menteeData) continue;

            res.push({
                mentorData,
                menteeData,
                points: (menteeData?.points || 0) + (mentorData?.points || 0)
            });
        }

        // sort descending by points
        res.sort( (a, b) => b.points - a.points )

        // return slice if limit requested
        return limit > 0 ? res.slice(0, limit) : res;
    }
}
