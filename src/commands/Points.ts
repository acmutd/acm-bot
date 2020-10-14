import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class PointsCommand extends Command {
    constructor() {
        super({
            name: 'points',
            description: 'Check Hacktoberfest point balance',
            usage: ['.points [user]'],
            dmWorks: false,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        let user: User | undefined;

        if (!msg.guild) {
            // shouldn't ever happen
            return msg.reply("This command cannot be run in DMs!");
        }

        user = await client.services.resolver.ResolveGuildUser(args[0], msg.guild).then((gm) => {
            return gm ? gm : (msg.author);
        });

        if (!user) {
            return client.response.emit(
                msg.channel,
                `I couldn't anyone named '${args[0]}'.`,
                'invalid'
            );
        }
        
        const {exists, data} = await client.services.hacktoberfest.getData(user.id);
        if (exists) {
            // we build a nice embed scorecard
            let scorecardEmbed = {
                color: '#93c2db',
                author: {
                    name: user.tag,
                    icon_url: user.avatarURL(),
                },
                title: `${data?.points} points`,
                description: '\n',
                footer: {
                    text: 'ACM Hacktoberfest',
                    icon_url: 'https://i.imgur.com/u6c1gDm.png',
                },
            }

            // add score breakdown if it exists
            let userActivities = [];
            if (data?.activities) {
                for (let activity in data?.activities) {
                    userActivities.push(`**${activity}**: ${data?.activities[activity]}\n`);
                }
                // now we sort userActivities, case-insensitive
                userActivities.sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                });
                // finally, add to description
                scorecardEmbed.description = "__**Breakdown of Points by Activity**__\n" + userActivities.join('');
            }

            return msg.channel.send({embed: scorecardEmbed});
        }
        else {
            return client.response.emit(
                msg.channel,
                `${user.tag} doesn't seem to be registered for Hacktoberfest`,
                'invalid'
            )
        }
    }
}
