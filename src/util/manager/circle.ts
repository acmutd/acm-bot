import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import {
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildMember,
  Message,
  parseEmoji,
  TextChannel,
  VoiceChannel,
} from "discord.js";

import Bot from "../../api/bot";
import { SlashCommandContext } from "../../api/interaction/slashcommand";
import Manager from "../../api/manager";
import { Circle, VCEvent } from "../../api/schema";
import { settings } from "../../settings";

const minutesInMs = 60000;

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
    // this.scheduleActivityReminder();
  }

  /**
   * Repost all circle messages. Used to update all the cards in the join circles channel, and send new ones
   * if new ones have been created.
   */
  public async repost({ interaction }: SlashCommandContext) {
    // Resolve join circles channel
    try {
      const c = await this.getChannel(this.joinChannelId);
      if (!c) {
        this.bot.managers.error.handleErr(new Error("Join channel not found"));
        return await interaction.followUp({
          content: "Join channel not found",
          ephemeral: true,
        });
      }
      await this.deleteOriginal(c);
      await this.sendHeader(c);
      // Build and send circle cards
      const circles: Circle[] = [
        ...this.bot.managers.firestore.cache.circles.values(),
      ];
      for (const circle of circles) await this.sendCircleCard(c, circle);

      await interaction.followUp({ content: "Done!", ephemeral: true });
    } catch (e) {
      this.bot.managers.error.handleErr(e as Error, "Error trying to repost");
      await interaction.followUp({
        ephemeral: true,
        content: "An error occurred, please contact a bot maintainer",
      });
    }
  }

  public async sendHeader(channel: TextChannel) {
    await channel.send(
      "https://cdn.discordapp.com/attachments/537776612238950410/826695146250567681/circles.png"
    );
    await channel.send(
      `> :yellow_circle: Circles are interest groups made by the community!\n` +
        `> :door: Join one by reacting to the emoji attached to each.\n` +
        `> :crown: You can apply to make your own Circle by filling out this application: <https://apply.acmutd.co/circles>\n`
    );
  }

  public async deleteOriginal(channel: TextChannel) {
    const msgs = await channel.messages.fetch({ limit: 50 });
    const promises = msgs.map((m) => m.delete());
    try {
      await Promise.allSettled(promises);
    } catch (e) {
      this.bot.managers.error.handleErr(e as any);
    }
  }

  public async sendCircleCard(channel: TextChannel, circle: Circle) {
    try {
      const owner = await channel.guild.members.fetch(circle.owner!).catch();
      const count = await this.findMemberCount(circle._id!);
      const role = await channel.guild.roles.fetch(circle._id!);
      // encodedData contains hidden data, stored within the embed as JSON string :) kinda hacky but it works
      const encodedData: any = {
        name: circle.name,
        circle: circle._id,
        reactions: {},
        channel: circle.channel,
      };
      encodedData.reactions[`${circle.emoji}`] = circle._id;

      const embed = new EmbedBuilder({
        title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
        color: role?.color,
        thumbnail: circle.imageUrl?.startsWith("http")
          ? { url: circle.imageUrl, height: 90, width: 90 }
          : undefined,
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
      }).setDescription(`${encode(encodedData)}${circle.description}`);
      const parsedEmoji = parseEmoji(circle.emoji!);
      // Build interactive/buttons portion of the card
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          label: `Join/Leave ${circle.name}`,
          custom_id: `circle/join/${circle._id}`,
          emoji: {
            name: parsedEmoji?.name,
            id: parsedEmoji?.id || undefined,
          },
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          label: `Learn More`,
          custom_id: `circle/about/${circle._id}`,
          disabled: true,
          style: ButtonStyle.Secondary,
        })
      );

      // Send out message
      await channel.send({ embeds: [embed], components: [actionRow] });
    } catch (e) {
      this.bot.managers.error.handleErr(e as any);
      this.bot.managers.error.handleErr(
        new Error(`Failed at ${circle.name}\n${JSON.stringify(circle)}`)
      );
      throw new Error("Cancelling repost");
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
    const embed = new EmbedBuilder({
      title: message.embeds[0].title || "",
      description: message.embeds[0].description || "",
      color: message.embeds[0].color!,
      footer: {
        text: message.embeds[0].footer?.text || "",
      },
      thumbnail: {
        url: message.embeds[0].thumbnail?.url || "",
      },

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
    const circle = this.getCircle(circleId);
    if (!circle)
      return await interaction.reply({
        content: "Circle not found",
        ephemeral: true,
      });
    await interaction.deferReply({ ephemeral: true });
    if (action == "join") await this.handleJoinLeave(circle, interaction);
    else if (action == "about") await this.handleSendAbout(circle, interaction);
    else
      return await interaction.editReply({
        content: "Valid interaction not found",
      });
  }

  public async handleJoinLeave(circle: Circle, interaction: ButtonInteraction) {
    // Resolve the user as a guild member
    const guild = await this.bot.guilds.fetch(settings.guild);
    const member = guild.members.resolve(interaction.user.id);
    if (!member) return;

    // Resolve circle channel
    const chan = await this.getCircleChannel(circle._id);
    if (!chan)
      return await interaction.editReply(
        "Something went wrong, please contact the bot maintainers"
      );
    if (!member.roles.cache.has(circle._id!))
      return await addRole(member, circle, interaction, chan);
    return await removeRole(member, circle, interaction);
  }

  public async handleSendAbout(circle: Circle, interaction: ButtonInteraction) {
    // Fetch some relevant information
    const owner = await interaction.guild!.members.fetch(circle.owner!).catch();
    const count = await this.findMemberCount(circle._id!);
    const role = await interaction.guild!.roles.fetch(circle._id!);

    // Build embed portion of the card
    const embed = new EmbedBuilder({
      title: `${circle.emoji} ${circle.name} ${circle.emoji}`,
      description: circle.description,
      color: role?.color,
      thumbnail: { url: circle.imageUrl!, height: 90, width: 90 },
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
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder({
        label: `Join/Leave ${circle.name}`,
        custom_id: `circle/join/${circle._id}`,
        emoji: { id: circle.emoji },
      })
    );
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
      const circles = [...this.bot.managers.firestore.cache.circles.values()];
      let inactiveCircles: [Circle, Message][] = [];
      for (const circle of circles) {
        const channel = (await this.bot.channels.fetch(
          circle.channel!
        )) as TextChannel;

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
      )) as TextChannel;

      // Build and send report
      let circleLeaders = inactiveCircles.map(
        ([circle]) => `<@${circle.owner}>`
      );

      let embed = new EmbedBuilder({
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
      // this.scheduleActivityReminder();
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

  private async getLastUserMessageInChannel(channel: TextChannel) {
    // Fetch up to 100 messages from the channel
    const messages = await channel.messages.fetch({ limit: 100 });
    // Loop from most recent to least recent
    for (const [_, msg] of [...messages.entries()].sort((a, b) =>
      a > b ? -1 : a < b ? 1 : 0
    ))
      if (!msg.author.bot) return msg;
    // No user messages found
    return undefined;
  }

  public getCircle(id: string) {
    return this.bot.managers.firestore.cache.circles.get(id);
  }

  public async getChannel(id: string) {
    const channel = await this.bot.channels.fetch(id);
    if (!channel) return undefined;
    return channel as TextChannel;
  }

  public async getCircleChannel(id: string) {
    const circle = this.getCircle(id);
    if (circle == undefined) return undefined;
    return await this.getChannel(circle.channel!);
  }

  public async runVCEvent(task: VCEvent) {
    await this.bot.managers.firestore.deleteVCEvent(task._id!);
    switch (task.type) {
      case "starting": {
        const channel = await this.createNewVCChannel(task);
        const textChannel = await this.getCircleChannel(task.circle._id)!;
        textChannel?.send(`The event is starting now! Join <#${channel.id}>`);
        const warn = await handleStart(task);
        const newTask = { ...warn, voiceChannel: channel.id };
        await this.bot.managers.firestore.updateVCEvent(newTask._id, newTask);
        await this.bot.managers.scheduler.createVCReminderTask(newTask);
        break;
      }
      case "ending soon": {
        const channel = await this.getCircleChannel(task.circle._id)!;
        const endTask = await handleWarning(task, channel!);
        await this.bot.managers.firestore.updateVCEvent(endTask._id, endTask);
        await this.bot.managers.scheduler.createVCReminderTask(endTask);
        break;
      }
      case "ended": {
        await this.sendActivityEnd(task);
        this.bot.managers.firestore.deleteVCEvent(task._id);
        break;
      }
    }
  }

  public async sendActivityEnd(task: VCEvent) {
    const channel = await this.getCircleChannel(task.circle._id)!;
    // Send message
    await channel!.send({
      content: `The event has ended! Thanks for participating!`,
    });

    const vcChannel = await this.bot.channels.fetch(task.voiceChannel!);
    if (!vcChannel || !(vcChannel instanceof VoiceChannel)) return;
    await vcChannel.delete();
  }

  private async createNewVCChannel(task: VCEvent): Promise<VoiceChannel> {
    const guild = this.bot.guilds.cache.first();
    const channel = await guild?.channels.create({
      name: task.title,
      type: ChannelType.GuildVoice,
      parent: settings.circles.parentCategory,
      permissionOverwrites: [
        { id: guild?.id, deny: ["ViewChannel", "Connect"] },
        { id: task.circleRole, allow: ["ViewChannel"] },
      ],
    });
    return channel as VoiceChannel;
  }
}

async function removeRole(
  member: GuildMember,
  circle: Circle,
  interaction: ButtonInteraction
) {
  await member.roles.remove(circle._id!);
  return await interaction.editReply({
    content: `Thank you for using circles. You have left ${circle.name}.`,
  });
}

async function addRole(
  member: GuildMember,
  circle: Circle,
  interaction: ButtonInteraction,
  chan: TextChannel
) {
  await member.roles.add(circle._id!);
  await interaction.editReply({
    content: `Thank you for joining ${circle.name}! Here's the channel: <#${circle.channel}>`,
  });
  return await chan.send(`${member}, welcome to ${circle.name}!`);
}

function encode(obj: any): string {
  return `[\u200B](http://fake.fake?data=${URIEncoding(JSON.stringify(obj))})`;
}
function URIEncoding(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function decode(description: string | null): any {
  if (!description) return;
  const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;
  const matches = description.match(re);
  if (!matches || matches.length < 2) return;
  return JSON.parse(decodeURIComponent(description.match(re)![1]));
}

const handleStart = async (task: VCEvent): Promise<VCEvent> => {
  // Create a new task to warn the circle 2 minutes before the event ends
  return {
    ...task,
    startsIn: new Date(Date.now() + 2 * minutesInMs),
    type: "ending soon",
  };
};

const handleWarning = async (
  task: VCEvent,
  channel: TextChannel
): Promise<VCEvent> => {
  // Send message
  await channel.send({
    content: `Event is ending soon!`,
  });
  return {
    ...task,
    startsIn: new Date(Date.now() + 4 * minutesInMs),
    type: "ended",
  };
};
