import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { GuildMember, Message, MessageEmbed } from 'discord.js';
// Officially adds a member to the discord server (different from a member joining).
export default class GuildMemberAddEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'guildMemberAdd');
    }
    /**
     * Standard Event Executor
     * @param client Bot Instance
     * @param member Guild Member
     * @returns Promise
     */
    public async emit(client: ACMClient, member: GuildMember) {
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
                iconURL: client.user!.avatarURL() as string,
            },
            fields: [
                {
                    name: `Step 1: Verify! The links below will become active once you verify.`,
                    value: `<#${client.settings.channels.verification}>`,
                },
                {
                    name: `Step 2: Get roles!`,
                    value: `<#${client.settings.channels.roles}>`,
                },
                {
                    name: `Step 3: Join Circles (interest groups)!`,
                    value: `<#${client.settings.channels.circles}>`,
                },
            ],
        });

        const channel = await member.createDM();
        if (channel) {
            channel.send(embed);
        }
    }
}
