import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import { Message, MessageAttachment } from 'discord.js';
import ACMClient from '../structures/Bot';
import axios from 'axios';
import { settings } from '../botsettings';

export default class AwardCommand extends Command {
    constructor() {
        super({
            name: 'award',
            description: 'Manually award Hacktoberfest points to users',
            usage: ['award [amount] [activity-id] [user1, user 2, user3...]'],
            dmWorks: false,
            requiredRole: settings.hacktoberfest.staffRole,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        // TODO: turn this into a wizard so people can't mess up as easily

        // invalid arg length
        if (args.length < 2) {
            return client.response.emit(
                msg.channel,
                `Usage: \`${this.getUsageText(client.settings.prefix)}\``,
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

        // scan message for userIds. This will catch mentions but not usernames/tags
        msg.content.match(/[\d]{17,18}/g)?.forEach((userId) => {
            awardees.add(userId);
        });

        let attachmentAwardees = await processAttachments(client, msg, points, activityId);
        if (attachmentAwardees) {
            for (let id of attachmentAwardees) {
                awardees.add(id);
            }
        }

        const { success, failure } = await client.services.hacktoberfest.awardPoints(
            points,
            activityId,
            awardees
        );

        // send back our results with mentions but not pings
        msg.reply(
            `Awarded **${points}** points to **${
                success.length
            }** users for completing **${activityId}**:\n${success.join(' ')}\n` +
                (failure.length
                    ? `${failure.length} users were not registered: ${failure.join(' ')}`
                    : ''),
            { allowedMentions: { users: [] } }
        );
    }
}

async function processAttachments(
    client: ACMClient,
    msg: Message,
    points: number,
    activityId: string
) {
    let awardees = new Set<string>();
    if (msg.attachments.size == 0) return;
    await Promise.all(
        msg.attachments.map(async (val) => {
            let attachmentAwardees = await processCSV(client, val);
            attachmentAwardees?.forEach((id) => {
                awardees.add(id);
            });
        })
    );
    return awardees;
}

async function processCSV(client: ACMClient, attachment: MessageAttachment) {
    let csvRaw: string;
    const emails: Set<string> = new Set<string>();

    try {
        csvRaw = (await axios.get(attachment.url)).data;
        for (let line of csvRaw.split('\n')) {
            let email = line.split(',')[1];
            emails.add(email);
        }
    } catch (error) {
        return;
    }

    let res = await client.services.hacktoberfest.emailsToSnowflakes(emails);
    return res;
}
