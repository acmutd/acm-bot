import Command, { CommandContext } from '../structures/Command';
import Wizard, {
    TextWizardNode,
    ColorWizardNode,
    UserMentionWizardNode,
    ConfirmationWizardNode,
} from '../utils/Wizard';
import { TextChannel } from 'discord.js';

export default class AdminCommand extends Command {
    constructor() {
        super({
            name: 'admin',
            description: 'A suite of commands for admin users.',
            userPermissions: 8,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        const wizard = new Wizard(msg, undefined, { title: '🔮 | ' });
        wizard.addNodes([
            new ConfirmationWizardNode(wizard, {
                title: 'Confirmation',
                description: 'Please confirm',
                color: 'BLUE',
            }),
        ]);
        var responses = await wizard.start();
        console.log(responses);
    }
}
