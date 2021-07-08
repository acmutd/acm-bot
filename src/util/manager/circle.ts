import {
  CategoryChannel,
  Guild,
  Message,
  MessageEmbed,
  MessageReaction,
  TextChannel,
  User,
} from "discord.js";
import { settings } from "../../settings";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export default class CircleManager extends Manager {
  private circleChannelId: string;
  constructor(bot: Bot) {
    super(bot);
    this.circleChannelId = this.bot.settings.channels.circles;
  }
  public init(): void {}

  public async repost() {
    const channel = this.bot.channels.resolve(this.circleChannelId);
    const c = channel as TextChannel;
    await c.bulkDelete(50);
    c.send(
      "https://cdn.discordapp.com/attachments/537776612238950410/826695146250567681/circles.png"
    );
    c.send(
      `> :yellow_circle: Circles are interest groups made by the community!\n` +
        `> :door: Join one by reacting to the emoji attached to each.\n` +
        `> :crown: You can apply to make your own Circle by filling out this application: <https://apply.acmutd.co/circles>\n`
    );

    const circles = this.bot.managers.database.cache.circles.array();
    for (const circle of circles) {
      const owner = await c.guild.members.fetch(circle.owner).catch();
      const count = await this.findMemberCount(circle._id);
      const role = await c.guild.roles.fetch(circle._id);
      const encodedData: any = {
        name: circle.name,
        circle: circle._id,
        reactions: {},
        channel: circle.channel,
      };
      encodedData.reactions[`${circle.emoji}`] = circle._id;
      const embed = new MessageEmbed({
        title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
        description: `${encode(encodedData)}${circle.description}`,
        color: role?.color,
        thumbnail: {
          url: circle.imageUrl,
          height: 90,
          width: 90,
        },
        fields: [
          { name: "**Role**", value: `<@&${circle._id}>`, inline: true },
          { name: "**Members**", value: `${count ?? "N/A"}`, inline: true },
        ],
        footer: {
          text: `⏰ Created on ${circle.createdOn.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}${owner ? `﹒👑 Owner: ${owner.displayName}` : ""}`,
        },
      });
      const msg = await c.send(embed);
      msg.react(`${circle.emoji}`);
    }
  }
  public async update(channel: TextChannel, circleId: string) {
    const msgs = await channel.messages.fetch({ limit: 50 });
    let message: Message | undefined;
    for (const m of msgs.array()) {
      if (m.embeds.length === 0) return;
      if (!m.embeds[0].description) return;

      const obj = decode(m.embeds[0].description);
      if (!obj || !obj.circle) return;
      if (obj.circle === circleId) {
        message = m;
        break;
      }
    }
    if (!message) return;
    const memberField = message.embeds[0].fields.find(
      (f) => f.name === "**Members**"
    );
    if (!memberField) return;

    const count = await this.findMemberCount(circleId);
    const embed = new MessageEmbed({
      title: message.embeds[0].title || "",
      description: message.embeds[0].description || "",
      color: message.embeds[0].color || "",
      footer: message.embeds[0].footer || {},
      thumbnail: message.embeds[0].thumbnail || {},
      fields: [
        { name: "**Role**", value: `<@&${circleId}>`, inline: true },
        { name: "**Members**", value: `${count ?? "N/A"}`, inline: true },
      ],
    });
    message.edit(embed);
  }

  public async findMemberCount(id: string) {
    const guild = await this.bot.guilds.fetch(settings.guild);
    return guild.members.cache.filter(
      (m) => !!m.roles.cache.find((r) => r.id === id)
    ).size;
  }
  public async handleReactionAdd(reaction: MessageReaction, user: User) {
    if (reaction.partial) await reaction.fetch();
    await reaction.users.fetch();
    if (user.bot) return;
    if (reaction.message.embeds.length === 0) return;
    if (!reaction.message.embeds[0].description) return;
    const obj = decode(reaction.message.embeds[0].description);
    if (!obj || obj.reactions) return;
    let reactionRes: string | undefined;
    Object.keys(obj.reactions).forEach((n) => {
      if (reaction.emoji.name.includes(n)) reactionRes = obj.reactions[n];
    });
    if (!reactionRes) return;
    reaction.users.remove(user.id);

    const guild = await this.bot.guilds.fetch(settings.guild);
    const member = guild.members.resolve(user.id);
    if (!member) return;
    if (!member.roles.cache.has(reactionRes)) {
      await member.roles.add(reactionRes);

      const chan = guild.channels.cache.get(obj.channel) as TextChannel;
      chan.send(`${member}, welcome to ${obj.name}!`);
    } else {
      await member.roles.remove(reactionRes);
    }
    this.update(reaction.message.channel as TextChannel, reactionRes);
  }
}
function encode(obj: any): string {
  return `[\u200B](http://fake.fake?data=${encodeURIComponent(
    JSON.stringify(obj)
  )})`;
}
function decode(description: string | null): any {
  if (!description) return;
  const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;
  const matches = description.match(re);
  if (!matches || matches.length < 2) return;
  return JSON.parse(decodeURIComponent(description.match(re)![1]));
}
