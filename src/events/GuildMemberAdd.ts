import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { GuildMember, Message, MessageEmbed } from 'discord.js';

export default class GuildMemberAddEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'guildMemberAdd');
    }

    public async emit(member: GuildMember) {
        const embed = new MessageEmbed({
            title: `**Welcome to the ACM Discord Server!** 🎉`,
            author: {
                name: `The Association for Computing Machinery`,
                icon_url: 'https://www.acmutd.co/png/acm-light.png',
                url: 'https://acmutd.co/',
            },
            color: `EC7621`,
            footer: {
                text: `Powered by ACM`,
                iconURL: this.client.user!.avatarURL() as string,
            },
            fields: [
                {
                    name: `Step 1: Verify!`,
                    value: `<#692430824712437840>`,
                },
                {
                    name: `Step 2: Get roles!`,
                    value: `<#761133757536796692>`,
                },
                {
                    name: `Step 3: Join Circles (interest groups)!`,
                    value: `<#804826523034451998>`,
                },
            ],
        });

        const channel = await member.createDM();
        if (channel) {
            channel.send(embed);
        }
    }
}
