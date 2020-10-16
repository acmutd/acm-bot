import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import { settings } from '../botsettings';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class PointsCommand extends Command {
    constructor() {
        super({
            name: 'raffle',
            description: 'Raffle off lucky winners based on their points',
            usage: ['.raffle [# winners]'],
            dmWorks: false,
            requiredRole: settings.hacktoberfest.staffRole,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        const allUsers = await client.services.hacktoberfest.getLeaderboard();
        let sum = 0;
        let numWinners: number;
        let winningTickets = new Set<number>();
        let winningUsers: string[] = [];
        let processedTickets = 0;

        if (args.length >= 1) {
            numWinners = +args[0];

            // invalid number of winners
            if (isNaN(numWinners) || numWinners < 1) {
                return client.response.emit(
                    msg.channel,
                    `\`${args[0]}\` is not a valid number of points between -100 and 100 (inclusive).`,
                    'invalid'
                );
            }
        }
        else {
            // default to 1 winner
            numWinners = 1;
        }

        // first, we want to find the sum of all points
        allUsers.forEach( (user) => {
            sum += user.points;
        });

        // now we want to generate random numbers accordingly
        for(let i = 0; i < numWinners; i ++) {
            winningTickets.add(Math.random()*sum);
        }

        // finally, pick out winners
        allUsers.forEach( (user, snowflake) => {
            processedTickets += user.points;
            // see if this user matches any winning tickets
            winningTickets.forEach( (ticket) => {
                if (ticket < processedTickets) {
                    winningUsers.push(`<@${snowflake}>`);
                    // remove winning tickets from ticket pool
                    winningTickets.delete(ticket);
                }
            });
        });

        msg.reply(`here are the winners:\n${winningUsers.join(' ')}`, {"allowedMentions": { "users" : []}});
    }
}
