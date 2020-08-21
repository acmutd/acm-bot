import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Member from '../structures/models/Member';
import Wizard, {
    TextWizardNode,
    UserMentionWizardNode,
    OptionsWizardNode,
    ChannelMentionWizardNode,
} from '../utils/Wizard';
import { Intents } from 'discord.js';

export default class AvatarCommand extends Command {
    constructor() {
        super({
            name: 'avatar',
            description: 'sends the link to ur avatar',
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        // const avatarURL = msg.author.displayAvatarURL({ format: 'png' });
        // // const results = await toolkit.ai.detectSafeSearch(avatarURL);
        // // context.msg.channel.send(`Explicit Results: ${results ? results.adult : 'No Results'}`);
        // // context.msg.channel.send(`Explicit Confidence: ${results ? results.adultConfidence : 'No Results'}`);
        // msg.channel.send('JUst making sure this command works');
        // msg.channel.send(`Here is ur avatar link: ${avatarURL}`);

        // wizard
        // 1. whats ur name
        // 2. mention a friend
        // 3. choose from a list of things
        // 4. mention all your favorite channels

        // init the wizard
        let wizard = new Wizard(msg, undefined, { title: '👋🏽 | ' });
        // declaring nodes
        wizard.addNodes([
            new TextWizardNode(wizard, {
                title: 'whats ur name??',
                description: 'please enter ur name',
            }),
            new UserMentionWizardNode(
                wizard,
                {
                    title: 'who is ur best friend??',
                },
                {
                    timer: 50,
                    invalidMessage: 'Yo that wasnt correct',
                }
            ),
            new OptionsWizardNode(
                wizard,
                {
                    title: 'choose from ur favorite thing',
                },
                ['oranges', 'apples', 'bananas']
            ),
            new ChannelMentionWizardNode(
                wizard,
                {
                    title: 'whats ur fav channels',
                },
                {
                    loopedCB: (item) => {
                        let lastThing = item[item.length - 1];
                        return { item };
                    },
                }
            ),
        ]);
        // starting the wizard
        const res = await wizard.start();
        if (res === false) return;
        console.log(res);
    }
}
