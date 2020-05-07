import Command from "../structures/Command";
import { CommandContext } from "../structures/Command";


export default class AvatarCommand extends Command {

    constructor() {
        super({
            name: 'avatar',
            description: 'sends the link to ur avatar',
        });
    }

    public async exec(context: CommandContext) {
        const avatarURL = context.msg.author.displayAvatarURL({format: 'png'});
        // const results = await toolkit.ai.detectSafeSearch(avatarURL);
        // context.msg.channel.send(`Explicit Results: ${results ? results.adult : 'No Results'}`);
        // context.msg.channel.send(`Explicit Confidence: ${results ? results.adultConfidence : 'No Results'}`);
        context.msg.channel.send('JUst making sure this command works');
        context.msg.channel.send(`Here is ur avatar link: ${avatarURL}`)
    }
}