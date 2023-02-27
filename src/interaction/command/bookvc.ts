import { ChannelType } from "discord-api-types/v10";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Role,
  TextChannel,
} from "discord.js";

import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { Task } from "../../util/manager/schedule";
import { Circle } from "./../../api/schema";
import { settings } from "./../../settings";
import { CIRCLE_PERMS } from "./../../util/perms";

export interface VCTask extends Task {
  payload: {
    eventStart: () => Promise<string>;
    duration: number;
    circle: string;
    channel: string;
    type: "start" | "warn" | "end";
    vcChannel?: string;
  };
}

export default class BookVC extends SlashCommand {
  public constructor() {
    super({
      name: "bookvc",
      description: "Setup a time to host a VC event for a circle",
      permissions: CIRCLE_PERMS,
    });
    this.slashCommand.addNumberOption((option) => {
      return option
        .setName("minutes")
        .setDescription("How many minutes until the event starts")
        .setRequired(true);
    });
    this.slashCommand.addRoleOption((option) => {
      return option
        .setName("circle")
        .setDescription("The circle you want to host the event for")
        .setRequired(true);
    });
    this.slashCommand.addStringOption((option) => {
      return option
        .setName("description")
        .setDescription("The description of the event")
        .setRequired(true);
    });
    this.slashCommand.addStringOption((option) => {
      return option
        .setName("title")
        .setDescription("The title of the event")
        .setRequired(true);
    });
    this.slashCommand.addNumberOption((option) => {
      return option
        .setName("duration")
        .setDescription("How long the event will last")
        .setRequired(true);
    });
  }

  // Interaction Handled !
  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const circleRole = interaction.options.getRole("circle", true) as Role;
    const circle = bot.managers.database.cache.circles.get(circleRole.id);
    try {
      if (!circle || !circle.channel)
        return await interaction.reply({
          content: "That circle doesn't exist",
          ephemeral: true,
        });
      const textChannel = await bot.channels.fetch(circle.channel);
      if (!textChannel || !(textChannel instanceof TextChannel))
        return await interaction.reply({
          content: "The circle channel doesn't exist",
          ephemeral: true,
        });

      const embed = createEmbed(interaction, circleRole, circle);

      await textChannel.send({
        content: `A new  event has been created. See below for more details`,
        embeds: [embed],
      });

      await interaction.reply({
        content: "Event created",
        ephemeral: true,
      });
      const guild = interaction.guildId!;

      const task = createCron(
        interaction,
        circle,
        guild,
        circleRole.id,
        textChannel
      );
      await bot.managers.scheduler.createTask(task);
    } catch (e) {
      await bot.managers.error.handleErr(e as any);
    }
  }
}
const createEmbed = (
  interaction: ChatInputCommandInteraction,
  role: Role,
  circle: Circle
) => {
  const timeTillStart = interaction.options.getNumber("minutes", true);
  const description = interaction.options.getString("description", true);
  const title = interaction.options.getString("title", true);
  const duration = interaction.options.getNumber("duration", true);
  return new EmbedBuilder()
    .addFields(
      { name: "Event", value: title },
      { name: "Description", value: description },
      { name: "Starts in", value: `${timeTillStart} minutes` },
      { name: "Duration", value: `${duration} minutes` }
    )
    .setColor(role.color)
    .setTitle(`${circle.emoji} ${circle.name}`);
};
const createCron = (
  interaction: ChatInputCommandInteraction,
  circle: Circle,
  guild: string,
  roleId: string,
  textChannel: TextChannel
): VCTask => {
  const eventStart = async () => {
    const newChannel = await interaction.guild?.channels.create({
      name: `${interaction.options.getString("title")}-${circle.name}-vc`,
      type: ChannelType.GuildVoice,
      parent: settings.circles.parentCategory,
      permissionOverwrites: [
        { id: guild, deny: "ViewChannel" },
        { id: roleId, allow: "ViewChannel" },
      ],
    });

    await textChannel.send(`The event is starting! Join <#${newChannel?.id}>!`);
    return newChannel!.id;
  };
  return {
    cron: new Date(
      Date.now() +
        interaction.options.getNumber("minutes", true) * millisecondsInMinute
    ),
    type: "circle_activity",
    payload: {
      eventStart,
      duration: interaction.options.getNumber("duration", true),
      circle: roleId,
      channel: circle.channel!,
      type: "start",
    },
  };
};
const millisecondsInMinute = 60000;
