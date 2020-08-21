import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Member from '../structures/models/Member';

export default class AvatarCommand extends Command {
    constructor() {
        super({
            name: 'avatar',
            description: 'sends the link to ur avatar',
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        const avatarURL = msg.author.displayAvatarURL({ format: 'png' });
        // const results = await toolkit.ai.detectSafeSearch(avatarURL);
        // context.msg.channel.send(`Explicit Results: ${results ? results.adult : 'No Results'}`);
        // context.msg.channel.send(`Explicit Confidence: ${results ? results.adultConfidence : 'No Results'}`);
        msg.channel.send('JUst making sure this command works');
        msg.channel.send(`Here is ur avatar link: ${avatarURL}`);
    }
}
