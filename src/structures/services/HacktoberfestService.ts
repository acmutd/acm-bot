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
    async awardPoints(points: number, reason: string, awardees: Set<string>) {
        let success: string[] = [];
        let failure: string[] = [];

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

                    await docRef?.update({
                        points: increment,
                    });
                    await this.client.firestore.firestore?.collection("htf_leaderboard/ledger").add({
                        name: doc.data()?.name,
                        reason: reason,
                        points: points,
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
}
