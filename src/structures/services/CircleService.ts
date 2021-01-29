import { Guild, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { settings } from '../../botsettings';
import ACMClient from '../Bot';

export default class CircleService {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }

    public async repost(c: TextChannel) {
        // get circle channel reference
        // const guild = await this.client.guilds.fetch('744488967465992225');
        // console.log(guild.channels.cache.size);
        // const channel = guild.channels.resolve('801307242640703518');
        // // clear the channel messages
        // if (!channel) {
        //     this.client.logger.error('could not get the thing');
        //     return;
        // }
        // const c = channel as TextChannel;
        // clear the channel
        await c.bulkDelete(50);
        // generate the title
        c.send('CIRCLES:');
        // generate the embeds
        const circles = this.client.database.cache.circles.array();
        for (const circle of circles) {
            let owner = await c.guild.members.fetch(circle.owner);
            let count = await this.findMemberCount(circle._id);
            let role = await c.guild.roles.fetch(circle._id);

            let encodedData: any = { circle: circle._id, reactions: {} };
            encodedData.reactions[`${circle.emoji}`] = circle._id;
            console.log(count);
            let embed = new MessageEmbed({
                title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
                description: `${encode(encodedData)}${circle.description}`,
                color: role?.color,
                thumbnail: {
                    url: circle.imageUrl,
                    height: 90,
                    width: 90,
                },
                fields: [
                    { name: '**Role**', value: `<@&${circle._id}>`, inline: true },
                    { name: '**Members**', value: `${count ?? 'N/A'}`, inline: true },
                ],
                footer: {
                    text: `⏰ Created on ${circle.createdOn.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}${owner ? `﹒👑 Owner: ${owner.displayName}` : ''}`,
                },
            });

            // add reaction roles to each
            const msg = await c.send(embed);
            msg.react(`${circle.emoji}`);
        }
    }

    // ! THERE IS A LIMIT OF 50 MESSAGES THIS CAN FETCH
    public async update(channel: TextChannel, circleId: string) {
        const msgs = await channel.messages.fetch({ limit: 50 });
        let message: Message | undefined;
        for (const m of msgs.array()) {
            if (m.embeds.length == 0) return;
            if (!m.embeds[0].description) return;

            const obj = decode(m.embeds[0].description);
            if (!obj) return;
            if (!obj.circle) return;

            if (obj.circle === circleId) {
                message = m;
                break;
            }
        }
        if (!message) return;
        const memberField = message.embeds[0].fields.find((f) => f.name == '**Members**');
        if (!memberField) return;

        const count = await this.findMemberCount(circleId);
        const embed = new MessageEmbed({
            title: message.embeds[0].title || '',
            description: message.embeds[0].description || '',
            color: message.embeds[0].color || '',
            footer: message.embeds[0].footer || {},
            thumbnail: message.embeds[0].thumbnail || {},
            fields: [
                { name: '**Role**', value: `<@&${circleId}>`, inline: true },
                { name: '**Members**', value: `${count ?? 'N/A'}`, inline: true },
            ],
        });

        message.edit(embed);
    }

    public async findMemberCount(id: string) {
        const guild = await this.client.guilds.fetch(settings.guild);
        return guild.members.cache.filter((m) => !!m.roles.cache.find((r) => r.id == id)).size;
    }

    public async handleReactionAdd(reaction: MessageReaction, user: User) {
        // fetch everything to ensure all the data is complete
        if (reaction.partial) await reaction.fetch();
        await reaction.users.fetch();

        if (user.bot) return;
        reaction.users.remove(user.id);
        if (reaction.message.embeds.length == 0) return;
        if (!reaction.message.embeds[0].description) return;

        const obj = decode(reaction.message.embeds[0].description);
        if (!obj) return;
        if (!obj.reactions) return;

        let reactionRes: string | undefined;

        Object.keys(obj.reactions).forEach((n) => {
            if (reaction.emoji.name.includes(n)) reactionRes = obj.reactions[n];
        });

        if (!reactionRes) return;

        const guild = await this.client.guilds.fetch(settings.guild);
        const member = guild.members.resolve(user.id);
        if (!member) return;

        if (!member.roles.cache.has(reactionRes)) await member.roles.add(reactionRes);
        else await member.roles.remove(reactionRes);

        this.update(reaction.message.channel as TextChannel, reactionRes);
    }
}

function encode(obj: any): string {
    return `[\u200B](http://fake.fake?data=${encodeURIComponent(JSON.stringify(obj))})`;
}

function decode(description: string | null): any {
    if (!description) return;
    const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;
    const matches = description.match(re);
    if (!matches || matches.length < 2) return;
    return JSON.parse(decodeURIComponent(description.match(re)![1]));
}
