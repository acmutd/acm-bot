import Command, { CommandContext } from '../structures/Command';
import ACMClient from '../structures/Bot';
import { Message, OverwriteResolvable, TextChannel } from 'discord.js';
import Wizard, {
    TextWizardNode,
    UserMentionWizardNode,
    EmojiWizardNode,
    GraphicWizardNode,
    ColorWizardNode,
} from '../utils/Wizard';
import { settings } from '../botsettings';
import { CircleData } from '../structures/models/Circle';

export default class CircleCommand extends Command {
    constructor() {
        super({
            name: 'circle',
            description: 'A suite of commands that help manage ACM Community Circles.',
            dmWorks: false,
        });
    }
    public async exec({ msg, client, args }: CommandContext) {
        switch (args[0]) {
            case 'add':
                await addCircle(client, msg, args);
                break;
            case 'repost':
                await client.services.circles.repost(msg.channel as TextChannel);
                break;
            default:
                msg.channel.send(
                    `Use \'${settings.prefix}project help\' to show a list of commands`
                );
                break;
        }
    }
}

// * Circle CRUD series
async function addCircle(client: ACMClient, msg: Message, args: string[]) {
    let wizard = new Wizard(msg, undefined, { title: '__**Circle Creation:**__ ' });
    wizard.addNodes([
        new UserMentionWizardNode(wizard, {
            title: 'Owner',
            description: `Who's the owner of the circle?`,
        }),
        new TextWizardNode(wizard, {
            title: 'Name',
            description: `What's the circle name?`,
        }),
        new TextWizardNode(wizard, {
            title: 'Description',
            description: `What's the circle description?`,
        }),
        new ColorWizardNode(wizard, {
            title: 'Color',
            description: `What's the circle color (used for the embed & role)?`,
        }),
        new EmojiWizardNode(wizard, {
            title: 'Emoji',
            description: `What's the circle's emoji?`,
        }),
        new GraphicWizardNode(wizard, {
            title: 'Image',
            description: `What's the circle's graphic/image (url)?`,
        }),
    ]);
    const res = await wizard.start();
    if (res === false) return;

    const circle: CircleData = {
        name: res[1],
        description: res[2],
        emoji: res[4][0],
        imageUrl: res[5],
        createdOn: new Date(),
        owner: res[0].id,
    };

    try {
        var owner = await msg.guild!.members.fetch(res[0].id);
    } catch (e) {
        client.response.emit(msg.channel, `Could not find member in the guild!`, 'error');
        return;
    }

    // 1. role
    var circleRole = await msg.guild!.roles.create({
        data: { name: `${circle.emoji} ${circle.name}`, mentionable: true, color: res[3] },
    });
    owner.roles.add(circleRole);
    // 2. category
    var permissions: OverwriteResolvable[] = [
        {
            id: msg.guild!.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role',
        },
        {
            id: circleRole,
            allow: ['VIEW_CHANNEL'],
            type: 'role',
        },
    ];
    var circleCategory = await msg.guild!.channels.create(`${circle.emoji} | ${circle.name}`, {
        type: 'category',
        permissionOverwrites: permissions,
    });
    // 3. channel
    var desc = `🎗️: ${circleRole.name}`;
    var circleChannel = await msg.guild!.channels.create(`${circle.name}`, {
        type: 'text',
        topic: desc,
        parent: circleCategory,
        permissionOverwrites: permissions,
    });
    var circleVoiceChannel = await msg.guild!.channels.create(`${circle.name}` + ' VC', {
        type: 'voice',
        parent: circleCategory,
        permissionOverwrites: permissions,
    });

    circle['_id'] = circleRole.id;
    circle.category = circleCategory.id;
    circle.owner = owner.id;

    // add circle
    let added = await client.database.circleAdd(circle);
    if (!added) {
        client.response.emit(msg.channel, `Could not add circle to the database!`, 'error');
        // delete the created stuff
        circleRole.delete();
        circleCategory.delete();
        circleChannel.delete();
        circleVoiceChannel.delete();
        return;
    }

    // client.services.circles.repost()

    // else
    client.response.emit(
        msg.channel,
        `Successfully created circle <@&${circleRole.id}>!`,
        'success'
    );
}
