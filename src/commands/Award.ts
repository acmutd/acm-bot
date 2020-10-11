import { FieldValue } from '@google-cloud/firestore';
import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { ConfirmationWizardNode } from '../utils/Wizard';

export default class AwardCommand extends Command {
    constructor() {
        super({
            name: 'award',
            description: 'Manually award Hacktoberfest points to users',
            usage: ['.award [amount] [reason-id] [user1, user 2, user3...]'],
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
        const reasonId = args[1];
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

        const {success, failure} = await client.services.hacktoberfest.awardPoints(points, reasonId, awardees);

        // send back our results
        msg.reply(`Successfully awarded ${points} points to ${success.length} participants: ${success.join(' ')}\n` +
                  `${failure.length} users were not registered: ${failure.join(' ')}`);

    }
}
