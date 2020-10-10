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
        const unregisteredAwardees = new Set<string>();
        let awardeeList: string[] = [];
        let unregisteredAwardeeList: string[] = [];

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

        // incrementor
        const increment = FieldValue.increment(points);

        // increment points on firestore
        for (let userId of awardees.values()) {
            try {
                client.firestore.firestore?.collection("htf_leaderboard/snowflake_to_all/mapping").doc(userId).update({
                    points: increment,
                });
                awardeeList.push(`<@${userId}>`);
            }
            catch (error) {
                console.log(error);
                unregisteredAwardeeList.push(`<@${userId}>`);
            }
        }

        // send back our results
        msg.reply(`Successfully awarded ${points} points to ${awardeeList.length} participants: ${awardeeList.join(' ')}\n` +
                  `${unregisteredAwardeeList.length} users were not registered: ${unregisteredAwardeeList.join(' ')}`);

    }
}
