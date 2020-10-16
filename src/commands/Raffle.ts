import { FieldValue } from '@google-cloud/firestore';
import { Guild, GuildMember, User } from 'discord.js';
import { settings } from '../botsettings';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class RaffleCommand extends Command {
    constructor() {
        super({
            name: 'raffle',
            description: 'Pick lucky winners with a weighted raffle',
            usage: ['.raffle [# winners]'],
            dmWorks: false,
            requiredRole: settings.hacktoberfest.staffRole,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        const allUsers = await client.services.hacktoberfest.getLeaderboard();
        let sum = 0;
        let numWinners: number;
        let winningNumbers = new Set<number>();
        let winningUsers: string[] = [];
        let processedTickets = 0;

        if (args.length >= 1) {
            numWinners = +args[0];

            // invalid number of winners
            if (isNaN(numWinners) || numWinners < 1 || numWinners > 50) {
                return client.response.emit(
                    msg.channel,
                    `\`${args[0]}\` is not a valid number of winners between 1 and 50 (inclusive).`,
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
            winningNumbers.add(Math.random()*sum);
        }

        // pick out winners
        for (let [snowflake, user] of allUsers) {
            let winnerCount = 0;
            processedTickets += user.points;
            // count up all the winning tickets
            winningNumbers.forEach( (ticket) => {
                if (ticket < processedTickets) {
                    winnerCount++;
                    winningNumbers.delete(ticket);
                }
            });

            // add the winning count to the person's stats
            if (winnerCount > 0) winningUsers.push(`<@${snowflake}>: ${winnerCount}`);

            // stop processing once all the winning numbers are gone
            if (winningNumbers.size == 0) break;
        }



        msg.reply(`here are the winners:\n${winningUsers.join('\n')}`, {"allowedMentions": { "users" : []}});
    }
}
