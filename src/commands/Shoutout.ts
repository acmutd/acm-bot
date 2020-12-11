import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import { settings } from '../botsettings';
import { MessageEmbed, TextChannel } from 'discord.js';
import color from '../utils/Color';

export default class ShoutoutCommand extends Command {
    constructor() {
        super({
            name: 'shoutout',
            description: 'shoutout someone special',
            usage: ['.shoutout [list of mentions] [reason for shoutout]'],
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        console.log(msg.content);
        console.log(args[0]);

        // make sure the first arg starts with a mention
        if (!/^<@!?[\d]{17,18}>/.test(args[0])) {
            client.response.emit(
                msg.channel,
                "You didn't mention a user to give the shoutout to!",
                'invalid'
            );
            return;
        }

        const receivers = msg.mentions.members!.array();
        let title = `📣 ${msg.member?.nickname ?? msg.author.username} gave a shoutout to `;
        const last = receivers.pop();
        if (receivers.length > 0) {
            title += `${receivers.map((m) => m.nickname ?? m.user.username).join(', ')}${
                receivers.length > 0 ? ', and ' : ''
            }${last?.nickname ?? last?.user.username}`;
        } else title += `${last?.nickname ?? last?.user.username}`;

        // this matches everything up until the first group of mentions stop
        const reg = /^.*?(<@!?[\d]{17,18}>|\s)+/;
        // extract the mentions
        let text = msg.content.replace(reg, '');

        if (text.length < 1) {
            return client.response.emit(msg.channel, `Usage: \`${this.usage[0]}\``, 'invalid');
        }

        const embed = new MessageEmbed({
            title,
            fields: [
                {
                    name: 'Given to:',
                    value: msg.content.match(reg)![0].replace(settings.prefix + 'shoutout', ''),
                },
                { name: 'For:', value: text },
            ],
            color: 'RANDOM',
        });

        const shoutoutChannel = msg.guild?.channels.resolve(
            settings.channels.shoutout
        ) as TextChannel;
        shoutoutChannel.send(embed);
        shoutoutChannel.send(msg.content.match(reg)![0].replace(settings.prefix + 'shoutout', ''));

        client.response.emit(
            msg.channel,
            'Your shoutout has been sent to ' + shoutoutChannel + '!',
            'success'
        );
    }
}
