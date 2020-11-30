import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, { OptionsWizardNode } from '../utils/Wizard';

export default class CaretakerCommand extends Command {
    constructor() {
        super({
            name: 'caretaker',
            description: 'Sends a caretaker message',
            usage: ['caretaker'],
            userPermissions: 8,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        let fullResponses: any[] = [];
        const responses =
            client.database.cache.responses
                .filter((r) => r.type == 'caretaker')
                .map((r) => {
                    fullResponses.push(r);
                    return r.message.toString();
                }) ?? [];
        let wizard = new Wizard(msg);
        wizard.addNode(
            new OptionsWizardNode(
                wizard,
                {
                    title: `__**Caretaker: Select a response**__`,
                    description: `Enter the number of the response you want to send out:`,
                },
                responses,
                false,
                { timer: 40 }
            )
        );
        const res = await wizard.start();

        if (res === false) return;
        const resp = res[0];
        if (resp.isOption) {
            const responseChoice = fullResponses[resp.value];
            // send the message
            try {
                await client.services.caretaker.send(responseChoice['_id']);
                client.response.emit(msg.channel, 'Successfully sent the response!', 'success');
            } catch (e) {
                client.response.emit(msg.channel, 'Was unable to send the response!', 'error');
            }
        } else {
            client.response.emit(msg.channel, 'That was not a valid option!', 'invalid');
        }
    }
}
