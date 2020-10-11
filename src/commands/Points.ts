import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember } from 'discord.js';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class PointsCommand extends Command {
    constructor() {
        super({
            name: 'points',
            description: 'Check Hacktoberfest point balance',
            usage: ['.points [user]'],
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        let userId: string | undefined = msg.author.id;
        let user: GuildMember | undefined;

        // get user if it was passed in. Supports straight ID, user ping, username, or user tag
        if (args.length > 0) {
            if (/^[\d]{17,18}$/.test(args[0])) {
                // interpret as plain ID
                userId = msg.guild?.members.cache.find(gm => gm.user.id == args[0])?.id;
            }
            else if (/^<@[\d]{17,18}>$/.test(args[0])) {
                // a user was mentioned
                userId = msg.guild?.members.cache.find(gm => gm.user.id == args[0].slice(2, -1))?.id;
            }
            else if (/#\d{4}/.test(args[0])) {
                // a user's full tag was included
                userId = msg.guild?.members.cache.find(gm => gm.user.tag == args[0])?.id;
            }
            else {
                // none of the above: try to resolve as a username
                userId = msg.guild?.members.cache.find(gm => gm.user.username == args[0])?.id;
            }

            if (!userId) {
                return client.response.emit(
                    msg.channel,
                    `I couldn't match a user in this server for '${args[0]}'.`,
                    'invalid'
                );
            }
        }
        
        user = msg.guild?.members.cache.find(gm => gm.user.id == userId);
        
        const {exists, data} = await client.services.hacktoberfest.getData(userId);
        if (exists && data?.points) {
            // we build a nice embed scorecard
            let scorecardEmbed = {
                color: '#93c2db',
                author: {
                    name: user?.user.tag,
                    icon_url: user?.user.avatarURL,
                },
                title: `${data?.points} points`,
                description: '**Points breakdown**\n',
                footer: {
                    text: 'ACM Hacktoberfest',
                    icon_url: 'https://i.imgur.com/u6c1gDm.png',
                },
            }

            let userActivities = [];
            if (data?.activities) {
                for (let activity in data?.activities) {
                    userActivities.push(`*${activity}*: ${data?.activities[activity]}\n`);
                }
            }

            scorecardEmbed.description.concat(...userActivities);

            return msg.channel.send({embed: scorecardEmbed});
        }
        else {
            return client.response.emit(
                msg.channel,
                `The user ${user?.user.tag} doesn't seem to be fully registered for Hacktoberfest`,
                'invalid'
            )
        }
    }
}
