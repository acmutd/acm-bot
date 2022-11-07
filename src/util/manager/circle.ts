import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  TextBasedChannel,
  TextChannel,
} from "discord.js";
import { settings } from "../../settings";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import { Circle } from "../../api/schema";

export default class CircleManager extends Manager {
  private readonly remindCron: string;
  private readonly remindThresholdDays: number;
  private readonly leaderChannelId: string;
  private readonly joinChannelId: string;

  constructor(bot: Bot) {
    super(bot);
    this.remindCron = this.bot.settings.circles.remindCron;
    this.remindThresholdDays = this.bot.settings.circles.remindThresholdDays;
    this.leaderChannelId = this.bot.settings.circles.leaderChannel;
    this.joinChannelId = this.bot.settings.circles.joinChannel;
  }

  public init(): void {
    this.scheduleActivityReminder();
  }

  /**
   * Repost all circle messages. Used to update all the cards in the join circles channel, and send new ones
   * if new ones have been created.
   */
  public async repost() {
    // Resolve join circles channel
    const channel = this.bot.channels.resolve(this.joinChannelId);
    const c = channel as TextChannel;

    // Delete original messages
    // manual bulk delete
    const msgs = await c.messages.fetch({ limit: 50 });
    // pseudo bulk delete
    const promises = msgs.map((m) => m.delete());
    await Promise.all(promises);

    // Send header
    await c.send(
      "https://cdn.discordapp.com/attachments/537776612238950410/826695146250567681/circles.png"
    );
    await c.send(
      `> :yellow_circle: Circles are interest groups made by the community!\n` +
        `> :door: Join one by reacting to the emoji attached to each.\n` +
        `> :crown: You can apply to make your own Circle by filling out this application: <https://apply.acmutd.co/circles>\n`
    );

    // Build and send circle cards
    const circles = [...this.bot.managers.database.cache.circles.values()];
    for (const circle of circles) {
      const owner = await c.guild.members.fetch(circle.owner!).catch();
      const count = await this.findMemberCount(circle._id!);
      const role = await c.guild.roles.fetch(circle._id!);

      // encodedData contains hidden data, stored within the embed as JSON string :) kinda hacky but it works
      const encodedData: any = {
        name: circle.name,
        circle: circle._id,
        reactions: {},
        channel: circle.channel,
      };
      encodedData.reactions[`${circle.emoji}`] = circle._id;

      // Build embed portion of the card
      const embed = new MessageEmbed({
        title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
        description: `${encode(encodedData)}${circle.description}`,
        color: role?.color,
        thumbnail: validURL(circle.imageUrl)
          ? {
              url: circle.imageUrl,
              height: 90,
              width: 90,
            }
          : undefined,
        fields: [
          { name: "**Role**", value: `<@&${circle._id}>`, inline: true },
          { name: "**Members**", value: `${count ?? "N/A"}`, inline: true },
        ],
        footer: {
          text: `⏰ Created on ${circle.createdOn!.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}${owner ? `﹒👑 Owner: ${owner.displayName}` : ""}`,
        },
      });

      // Build interactive/buttons portion of the card
      const actionRow = new MessageActionRow({
        components: [
          new MessageButton({
            label: `Join/Leave ${circle.name}`,
            customId: `circle/join/${circle._id}`,
            style: "PRIMARY",
            emoji: circle.emoji,
          }),
          new MessageButton({
            label: `Learn More`,
            customId: `circle/about/${circle._id}`,
            style: "SECONDARY",
            disabled: true,
          }),
        ],
      });

      // Send out message
      await c.send({ embeds: [embed], components: [actionRow] });
    }
  }

  public async update(channel: TextChannel, circleId: string) {
    const msgs = await channel.messages.fetch({ limit: 50 });
    let message: Message | undefined;
    for (const m of msgs.values()) {
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
      color: message.embeds[0].color!,
      footer: message.embeds[0].footer || {},
      thumbnail: message.embeds[0].thumbnail || {},
      fields: [
        { name: "**Role**", value: `<@&${circleId}>`, inline: true },
        { name: "**Members**", value: `${count ?? "N/A"}`, inline: true },
      ],
    });
    await message.edit({ embeds: [embed] });
  }

  public async findMemberCount(id: string) {
    const guild = await this.bot.guilds.fetch(settings.guild);
    await guild.members.fetch();
    return guild.members.cache.filter(
      (m) => !!m.roles.cache.find((r) => r.id === id)
    ).size;
  }

  public async handleButton(interaction: ButtonInteraction) {
    // Parse customId
    const match = interaction.customId.match(/circle\/([^\/]*)\/([^\/]+)/);
    const action = match![1];
    const circleId = match![2];

    // Resolve circle
    const circle = [...this.bot.managers.database.cache.circles.values()].find(
      (x) => x._id == circleId
    );
    if (!circle) return;

    if (action == "join") await this.handleJoinLeave(circle, interaction);
    else if (action == "about") await this.handleSendAbout(circle, interaction);
  }

  public async handleJoinLeave(circle: Circle, interaction: ButtonInteraction) {
    // Resolve the user as a guild member
    const guild = await this.bot.guilds.fetch(settings.guild);
    const member = guild.members.resolve(interaction.user.id);
    if (!member) return;

    // Resolve circle channel
    const chan = (await guild.channels.fetch(circle.channel!)) as TextChannel;

    if (!member.roles.cache.has(circle._id!)) {
      await member.roles.add(circle._id!);
      await interaction.reply({
        content: `Thank you for joining ${circle.name}! Here's the channel: <#${circle.channel}>`,
        ephemeral: true,
      });
      await chan.send(`${member}, welcome to ${circle.name}!`);
    } else {
      await member.roles.remove(circle._id!);
      await interaction.reply({
        content: `Thank you for using circles. You have left ${circle.name}.`,
        ephemeral: true,
      });
    }
  }

  public async handleSendAbout(circle: Circle, interaction: ButtonInteraction) {
    // Fetch some relevant information
    const owner = await interaction.guild!.members.fetch(circle.owner!).catch();
    const count = await this.findMemberCount(circle._id!);
    const role = await interaction.guild!.roles.fetch(circle._id!);

    // Build embed portion of the card
    const embed = new MessageEmbed({
      title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
      description: circle.description,
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
        text: `⏰ Created on ${circle.createdOn!.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}${owner ? `﹒👑 Owner: ${owner.displayName}` : ""}`,
      },
    });

    // Build interactive/buttons portion of the card
    const actionRow = new MessageActionRow({
      components: [
        new MessageButton({
          label: `Join/Leave ${circle.name}`,
          customId: `circle/join/${circle._id}`,
          style: "PRIMARY",
          emoji: circle.emoji,
        }),
      ],
    });

    // Send out message as ephemeral reply
    await interaction.reply({
      content: `You asked to learn more about ${circle.name}`,
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  }

  public async sendActivityReminder(payload: any) {
    try {
      // Consider disabled if threshold is non-positive
      if (this.remindThresholdDays <= 0) return;

      // Create list of inactive circles & their last messages
      const circles = [...this.bot.managers.database.cache.circles.values()];
      let inactiveCircles: [Circle, Message][] = [];
      for (const circle of circles) {
        const channel = (await this.bot.channels.fetch(
          circle.channel!
        )) as TextBasedChannel;

        const lastMessage = await this.getLastUserMessageInChannel(channel);
        if (
          lastMessage == undefined ||
          new Date().getTime() - lastMessage.createdAt.getTime() >
            this.remindThresholdDays * 24 * 3600 * 1000
        ) {
          inactiveCircles.push([circle, lastMessage!]);
        }
      }

      // Do nothing if all circles are active
      if (inactiveCircles.length == 0) return;

      // Fetch leader circle to send report in
      const leaderChannel = (await this.bot.channels.fetch(
        this.leaderChannelId
      )) as TextBasedChannel;

      // Build and send report
      let circleLeaders = inactiveCircles.map(
        ([circle]) => `<@${circle.owner}>`
      );

      let embed = new MessageEmbed({
        title: "Circles Inactivity Report",
        description:
          `**${inactiveCircles.length}/${circles.length} circles have been inactive ` +
          `for ${this.remindThresholdDays} days.**\n` +
          inactiveCircles
            .map(([circle, lastMessage]) =>
              lastMessage == undefined
                ? `${circle.name} (Could not load messages)`
                : `[${circle.name}](${lastMessage.url})`
            )
            .join("\n"),
        footer: {
          text:
            "This bot only tracks the main channel of each circle. " +
            "If your circle has activity in a side channel, you may ignore this message.",
        },
      });

      await leaderChannel.send({
        content: circleLeaders.join(""),
        embeds: [embed],
      });
    } finally {
      this.scheduleActivityReminder();
    }
  }

  /**
   * Deletes and re-schedules circle activity reminder, in scheduler.
   * Override is done so that cron can be changed around as needed.
   */
  private scheduleActivityReminder() {
    // Delete any existing reminders
    this.bot.managers.scheduler.deleteTask("circle_activity_reminder");

    // Schedule new reminder
    this.bot.managers.scheduler.createTask({
      id: "circle_activity_reminder",
      type: "circle_activity_reminder",
      cron: this.remindCron,
    });
  }

  private async getLastUserMessageInChannel(
    channel: TextBasedChannel
  ): Promise<Message | undefined> {
    // Fetch up to 100 messages from the channel
    const messages = await channel.messages.fetch({ limit: 100 });

    // Loop from most recent to least recent
    for (const [snowflake, msg] of [...messages.entries()].sort((a, b) =>
      a > b ? -1 : a < b ? 1 : 0
    )) {
      if (!msg.author.bot) return msg;
    }

    return undefined;
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

const validURL = (str?: string) => {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch (e) {
    return false;
  }
};
