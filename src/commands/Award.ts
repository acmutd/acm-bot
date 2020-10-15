import { FieldValue } from '@google-cloud/firestore';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { Message, MessageAttachment } from 'discord.js'
import ACMClient from '../structures/Bot'
const streamifier = require('streamifier');
const csv = require('csv-parser')
import fs from 'fs';

export type ActivityType = "";

export default class AwardCommand extends Command {
    constructor() {
        super({
            name: 'award',
            description: 'Manually award Hacktoberfest points to users',
            usage: ['.award [amount] [activity-id] [user1, user 2, user3...]'],
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        // TODO: turn this into a wizard so people can't mess up as easily

        // invalid arg length
        if (args.length < 3) {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.usage[0]}\``,
                'invalid'
            );
        }

        const points = +args[0];
        const activityId = args[1];
        const awardees = new Set<string>();

        // invalid award amount
        if (isNaN(points) || points < -100 || points > 100) {
            return client.response.emit(
                msg.channel,
                `\`${args[0]}\` is not a valid number of points between -100 and 100 (inclusive).`,
                'invalid'
            );
        }

        processAttachments(client, msg, points, activityId);

        // scan message for userIds. This will catch mentions but not usernames/tags
        msg.content.match(/[\d]{17,18}/g)?.forEach((userId) => {
            awardees.add(userId);
        });

        const {success, failure} = await client.services.hacktoberfest.awardPoints(points, activityId, awardees);

        // send back our results with mentions but not pings
        msg.reply(`Awarded **${points}** points to **${success.length}** users for completing **${activityId}**:\n${success.join(' ')}\n` +
                (failure.length ? `${failure.length} users were not registered: ${failure.join(' ')}` : ''), 
                {"allowedMentions": { "users" : []}});

    }
}

function processAttachments(client: ACMClient, msg: Message, points: number, activityId: string) {
    if(msg.attachments.size == 0) return;
    msg.attachments.forEach(val => {
        if(val.name?.endsWith(".csv")) {
            processCSV(client, msg, val, points, activityId);
        }
    })
}

async function processCSV(client: ACMClient, msg: Message, val: MessageAttachment, points: number, activityId: string) {
    const results: Set<string> = new Set<string>();

    await streamifier.createReadStream()
        .pipe(csv(['name', 'email', 'minutes']))
        .on('data', (data: string) => results.add(data))
        .on('end', () => {
            console.log(results);
        });

    const ids = await client.services.hacktoberfest.emailsToSnowflakes(results);
    if(ids && ids.length > 0) {
        const response = await client.services.hacktoberfest.awardPoints(points, activityId, new Set<string>(ids));
        client.response.emit(msg.channel,  `Successfully added points to **${response.success}** people!\nFailed to add points to **${response.failure}** people.`)
    }
}