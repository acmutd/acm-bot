import Command, { CommandContext } from '../structures/Command';
import Wizard, {
    TextWizardNode,
    ColorWizardNode,
    UserMentionWizardNode,
    ConfirmationWizardNode,
    OptionsWizardNode,
    ChannelMentionWizardNode,
} from '../utils/Wizard';
import { TextChannel, Message } from 'discord.js';
import ACMClient from '../structures/Bot';

export default class AdminCommand extends Command {
    constructor() {
        super({
            name: 'admin',
            description: 'A suite of commands for admin users.',
            userPermissions: 8,
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        switch (args[0]) {
            case 'responses':
                await responses(client, msg, args);
                break;
            case 'edit':
                await edit(client, msg, args);
                break;
            case 'channels':
                await channels(client, msg, args);
                break;
            case 'strikes':
                // await checkStrikes(client, msg, args);
                break;
            case 'mute':
                // await mute(client, msg, args);
                break;
            default:
                await msg.channel.send(
                    `That was an invalid argument. Try again smh <@${msg.author.id}>`
                );
                return;
        }
    }
}

async function edit(client: ACMClient, msg: Message, args: string[]) {}

async function responses(client: ACMClient, msg: Message, args: string[]) {
    var options = ['kick', 'ban', 'mute', 'strike'];
    switch (args[1]) {
        case 'kick':
            await responseAddRemove(client, msg, args, 'kick');
            break;
        case 'ban':
            await responseAddRemove(client, msg, args, 'ban');
            break;
        case 'mute':
            await responseAddRemove(client, msg, args, 'mute');
            break;
        case 'strike':
            await responseAddRemove(client, msg, args, 'strike');
            break;
        default:
            var str = '';
            options.forEach((v) => (str += '\n.admin responses ' + v));
            msg.channel.send(
                'You have to specify what type of response you want to add/remove from. Current types: ```' +
                    str +
                    '```'
            );
    }
}

async function responseAddRemove(
    client: ACMClient,
    msg: Message,
    args: string[],
    type: 'strike' | 'mute' | 'ban' | 'kick'
) {
    const placeholder = '<user>';
    // 1. get current responses
    var responses = client.database.cache.guilds.get(msg.guild!.id)!.responses[type] ?? [];
    let wizard = new Wizard(msg);
    wizard.addNode(
        new OptionsWizardNode(
            wizard,
            {
                title: `__**Event Response Settings: Add/Remove ${type.toUpperCase()} Event Responses**__`,
                description: `Enter the number of the response you want to delete, or type in a new response to add.\n __The username placeholder is \'${placeholder}\'__. Ex: \'${placeholder} just got banned!\'`,
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
        var responseChoice = responses[resp.value];
        // 2. remove option index
        let obj: any = { $pull: {} };
        obj['$pull'][`responses.${type}`] = responseChoice;
        await client.database.updateGuild(msg.guild!.id, obj);
        return client.response.emit(
            msg.channel,
            "Successfully removed a response from the '" + type + "' event.",
            'success'
        );
    } else {
        // 3. add option to list
        var newResponse = resp.value;
        let obj: any = { $addToSet: {} };
        obj['$addToSet'][`responses.${type}`] = newResponse;
        await client.database.updateGuild(msg.guild!.id, obj);
        return client.response.emit(
            msg.channel,
            "Successfully added a response to the '" + type + "' event.",
            'success'
        );
    }
}

async function channels(client: ACMClient, msg: Message, args: string[]) {
    var channelOptions = ['confirmation', 'error', 'bulletin'];

    let wizard = new Wizard(msg);
    wizard.addNode(
        new OptionsWizardNode(
            wizard,
            {
                title: '__**Channel Settings: Type**__',
                description: 'What channel type would you like to reconfigure?',
            },
            channelOptions,
            true
        )
    );
    const res = await wizard.start();
    if (res === false) return;
    const channelType = res[0];

    let wizard2 = new Wizard(msg);
    wizard2.addNode(
        new ChannelMentionWizardNode(wizard, {
            title: '__**Channel Settings: New Channel**__',
            description:
                'Mention the channel you would like to make the new ' +
                channelOptions[channelType.value] +
                ' channel:',
        })
    );
    const res2 = await wizard.start();
    if (res2 === false) return;
    const newChannel = res2[0];

    var obj: any = {};
    obj[`channels.${channelOptions[channelType.value]}`] = newChannel.id;
    try {
        await client.database.updateGuild(msg.guild!.id, obj);
        return client.response.emit(
            msg.channel,
            `Successfully reconfigured channel settings for the ${
                channelOptions[channelType.value]
            } channel`,
            'success'
        );
    } catch (err) {
        return client.response.emit(
            msg.channel,
            'There was an issue updating the channel.',
            'error'
        );
    }
}
