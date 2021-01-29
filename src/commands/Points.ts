import { FieldValue } from '@google-cloud/firestore';
import axios from 'axios';
import {
    Guild,
    GuildMember,
    Message,
    MessageAttachment,
    MessageEmbed,
    User,
    VoiceChannel,
} from 'discord.js';
import ACMClient from '../structures/Bot';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';
import { settings } from '../botsettings';

export default class PointsCommand extends Command {
    constructor() {
        super({
            name: 'points',
            description: 'Suite of commands to manage the points system',
            longDescription:
                'Suite of commands to manage the points system.\n' +
                'You can check and award points, display the leaderboard, or hold a weighted raffle.\n' +
                'Each option also has an alias for ease of use:\n' +
                '`check`: `c`\b' +
                '`award`: `a`\b' +
                '`leaderboard`: `lb`\b' +
                '`raffle`: `r`' +
                '`vcevent`: `vc`',
            usage: [
                'points check [user]',
                'points award <amount> <activity-id> [user1 [user2 [user3 ...]]]',
                'points leaderboard [limit=10]',
                'points raffle [winners=1]',
                'points vcevent <amount> <activity-id>',
            ],
            dmWorks: false,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        if (!msg.guild) {
            // shouldn't ever happen, but we"re gonna include it just for typescript 😄
            return msg.reply('This command cannot be run in DMs!');
        }

        if (args.length < 1) return this.sendInvalidUsage(msg, client);

        switch (args[0].toLowerCase()) {
            case 'check':
            case 'c': {
                // default to the author if arg not included
                let user: User | undefined = msg.author;

                if (args.length > 1) {
                    const unresolvedUser = args[1];
                    user = await client.services.resolver.ResolveGuildUser(
                        unresolvedUser,
                        msg.guild
                    );

                    if (!user) {
                        return client.response.emit(
                            msg.channel,
                            `I couldn't anyone named \`${unresolvedUser}\`.`,
                            'invalid'
                        );
                    }
                }

                const data = await client.services.points.getUser(user.id);
                if (data != undefined) {
                    // we build a nice embed scorecard
                    let scorecardEmbed = new MessageEmbed({
                        color: '#93c2db',
                        author: {
                            name: `${user.tag} (${data.full_name})`,
                            iconURL: user.avatarURL() ?? '',
                        },
                        title: `${data?.points} points`,
                        description: '\n',
                        footer: {
                            text: 'ACM Education',
                            iconURL: 'https://i.imgur.com/THllTFL.png',
                        },
                    });

                    // add score breakdown if it exists
                    let userActivities = [];
                    if (data?.activities) {
                        for (let activity in data?.activities) {
                            userActivities.push(`**${activity}**: ${data?.activities[activity]}`);
                        }
                        // now we sort userActivities, case-insensitive
                        userActivities.sort((a, b) => {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        });
                        // finally, add to description
                        scorecardEmbed.description =
                            '__**Activities**__\n' + userActivities.join('\n');
                    }

                    return msg.channel.send(scorecardEmbed);
                } else {
                    return client.response.emit(
                        msg.channel,
                        `${user} doesn't seem to be registered in the system.`,
                        'invalid'
                    );
                }
            }

            case 'award':
            case 'a': {
                if (!msg.member!.roles.cache.has(settings.points.staffRole)) {
                    return client.response.emit(
                        msg.channel,
                        `${msg.member}, you are unauthorized!`,
                        'invalid'
                    );
                }

                if (args.length < 3) {
                    return client.response.emit(
                        msg.channel,
                        `Award some points to user(s) for completing some activity.\n` +
                            `Specify the users by pinging them or attaching a zoom attendance sheet.\n` +
                            `Usage: \`${client.settings.prefix}${this.usage[1]}\`\n`,
                        'invalid'
                    );
                }

                const unresolvedPoints = args[1];
                const activityId = args[2];
                const awardees = new Set<string>();

                const points = +unresolvedPoints;

                // invalid award amount
                if (isNaN(points)) {
                    return client.response.emit(
                        msg.channel,
                        `\`${unresolvedPoints}\` is not a valid number.`,
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

                const { success, failure } = await client.services.points.awardPoints(
                    points,
                    activityId,
                    awardees
                );

                // send back our results with mentions but not pings
                return msg.reply(
                    `Awarded **${points}** points to **${
                        success.length
                    }** users for completing **${activityId}**:\n${success.join(' ')}\n` +
                        (failure.length
                            ? `${failure.length} users were not registered: ${failure.join(' ')}`
                            : ''),
                    { allowedMentions: { users: [] } }
                );
            }

            case 'leaderboard':
            case 'lb': {
                if (!msg.member!.roles.cache.has(settings.points.staffRole)) {
                    return client.response.emit(
                        msg.channel,
                        `${msg.member}, you are unauthorized!`,
                        'invalid'
                    );
                }

                const unresolvedNumUsers = args[1];
                let numUsers = 0; // default to all

                if (unresolvedNumUsers) {
                    numUsers = +unresolvedNumUsers;

                    // invalid number of users
                    if (isNaN(numUsers)) {
                        return client.response.emit(
                            msg.channel,
                            `\`${numUsers}\` is not a valid number.`,
                            'invalid'
                        );
                    }
                }

                const allPairs = await client.services.points.getLeaderboard(numUsers);

                let descriptionArr: string[] = [];
                allPairs.forEach((pair, i) => {
                    if (pair.points > 0)
                        descriptionArr.push(
                            `\`${i + 1}\`. <@${pair.menteeData.snowflake}>+<@${
                                pair.mentorData.snowflake
                            }>: ${pair.points} points`
                        );
                });

                return msg.channel.send(
                    new MessageEmbed({
                        title: 'Leaderboard',
                        description: descriptionArr.join('\n'),
                    })
                );
            }

            case 'raffle':
            case 'r': {
                if (!msg.member!.roles.cache.has(settings.points.staffRole)) {
                    return client.response.emit(
                        msg.channel,
                        `${msg.member}, you are unauthorized!`,
                        'invalid'
                    );
                }

                const allPairs = await client.services.points.getLeaderboard();
                const unresolvedNumWinners = args[1];
                let sum = 0;
                let numWinners: number;
                let winningNumbers = new Set<number>();
                let winningUsers: string[] = [];
                let processedTickets = 0;

                if (unresolvedNumWinners) {
                    numWinners = +unresolvedNumWinners;

                    // invalid number of winners
                    if (isNaN(numWinners) || numWinners < 1 || numWinners > 50) {
                        return client.response.emit(
                            msg.channel,
                            `\`${unresolvedNumWinners}\` is not a valid number of winners between 1 and 50 (inclusive).`,
                            'invalid'
                        );
                    }
                } else {
                    // default to 1 winner
                    numWinners = 1;
                }

                // first, we want to find the sum of all points for pairs with > 0 points
                const filteredPairs = allPairs.filter((pair) => pair.points > 0);
                filteredPairs.forEach((pair) => {
                    sum += pair.points;
                });

                // now we want to generate random numbers accordingly
                for (let i = 0; i < numWinners; i++) {
                    winningNumbers.add(Math.random() * sum);
                }

                // pick out winners
                for (let pair of filteredPairs) {
                    let winnerCount = 0;
                    processedTickets += pair.points;
                    // count up all the winning tickets
                    winningNumbers.forEach((ticket) => {
                        if (ticket < processedTickets) {
                            winnerCount++;
                            winningNumbers.delete(ticket);
                        }
                    });

                    // add the winning count to the person's stats
                    if (winnerCount > 0)
                        winningUsers.push(
                            `<@${pair.menteeData.snowflake}>+<@${pair.mentorData.snowflake}>: ${winnerCount}`
                        );

                    // stop processing once all the winning numbers are gone
                    if (winningNumbers.size == 0) break;
                }

                return msg.channel.send(
                    new MessageEmbed({
                        title: '🎉 The winners (and how many times they won)',
                        description: winningUsers.join('\n'),
                    })
                );
            }

            case 'vcevent':
            case 'vc': {
                if (!msg.member!.roles.cache.has(settings.points.staffRole)) {
                    return client.response.emit(
                        msg.channel,
                        `${msg.member}, you are unauthorized!`,
                        'invalid'
                    );
                }

                if (args.length < 3) {
                    return client.response.emit(
                        msg.channel,
                        `Award some points to user(s) in your current voice channel.\n` +
                            `Usage: \`${client.settings.prefix}${this.usage[4]}\`\n`,
                        'invalid'
                    );
                }

                const unresolvedPoints = args[1];
                const activityId = args[2];
                let attendees = new Set<string>();
                let voiceChannel: VoiceChannel | null | undefined;
                const points = +unresolvedPoints;

                // invalid award amount
                if (isNaN(points)) {
                    return client.response.emit(
                        msg.channel,
                        `\`${unresolvedPoints}\` is not a valid number.`,
                        'invalid'
                    );
                }

                // attempt to resolve the vc
                voiceChannel = msg.member?.voice.channel;
                if (!voiceChannel) {
                    return client.response.emit(
                        msg.channel,
                        `Please join a voice channel!`,
                        'invalid'
                    );
                }

                for (const [, member] of voiceChannel.members) {
                    if (member.user.bot) continue;
                    attendees.add(member.id);
                }

                const { success, failure } = await client.services.points.awardPoints(
                    points,
                    activityId,
                    attendees
                );

                return msg.reply(
                    `Awarded **${points}** points to **${
                        success.length
                    }** users for completing **${activityId}**:\n${success.join(' ')}\n` +
                        (failure.length
                            ? `${failure.length} users were not registered: ${failure.join(' ')}`
                            : ''),
                    { allowedMentions: { users: [] } }
                );
            }

            default:
                return this.sendInvalidUsage(msg, client);
        }
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
        const csvLines = csvRaw.split('\n');
        // determine email column
        const headers = csvLines[0].split(',');
        const emailColNum = headers.indexOf('Email');

        // extract emails from remaining csv
        for (let lineNum = 1; lineNum < csvLines.length; lineNum++) {
            let email = csvLines[lineNum].split(',')[emailColNum];
            emails.add(email);
        }
    } catch (error) {
        return;
    }

    let res = await client.services.points.emailsToSnowflakes(emails);
    return res;
}
