import { settings } from "./../../settings";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { EmbedBuilder, TextChannel } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord-api-types/v10";
import { Task } from "../../util/manager/schedule";

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

const perms =
  PermissionFlagsBits.ManageRoles |
  PermissionFlagsBits.ManageChannels |
  PermissionFlagsBits.ManageMessages;

export default class BookVC extends SlashCommand {
  public constructor() {
    super({
      name: "bookvc",
      description: "Setup a time to host a VC event for a circle",
      permissions: perms,
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
  public async handleInteraction({
    bot,
    interaction,
  }: SlashCommandContext): Promise<void> {
    try {
      const timeTillStart = interaction.options.getNumber("minutes", true);
      const circleRole = interaction.options.getRole("circle", true);
      const description = interaction.options.getString("description", true);
      const title = interaction.options.getString("title", true);
      const duration = interaction.options.getNumber("duration", true);
      const circle = bot.managers.database.cache.circles.get(circleRole.id);
      if (!circle) {
        await interaction.reply({
          content: "That circle doesn't exist",
          ephemeral: true,
        });
        return;
      }
      const embed = new EmbedBuilder()
        .addFields(
          {
            name: "Event",
            value: title,
          },
          {
            name: "Description",
            value: description,
          },
          {
            name: "Starts in",
            value: `${timeTillStart} minutes`,
          },
          {
            name: "Duration",
            value: `${duration} minutes`,
          }
        )
        .setColor(circleRole.color)
        .setTitle(`${circle.emoji} ${circle.name}`);
      const circleChannel = circle.channel!;
      const textChannel = (await bot.managers.database.bot.channels.fetch(
        circleChannel
      )) as TextChannel | null;

      if (!textChannel) {
        await interaction.reply({
          content: "The circle channel doesn't exist",
          ephemeral: true,
        });
        return;
      }

      await textChannel.send({
        content: `<@&${circleRole.id}> ${title} event has been created. See below for more details`,
        embeds: [embed],
      });

      await interaction.reply({
        content: "Event created",
        ephemeral: true,
      });
      const guild = interaction.guildId!;

      const eventStart = async () => {
        const newChannel = await interaction.guild?.channels.create({
          name: `${title}-${circle.name}-vc`,
          type: ChannelType.GuildVoice,
          parent: settings.circles.parentCategory,
          permissionOverwrites: [
            {
              id: guild,
              deny: "ViewChannel",
            },
            {
              id: circleRole.id,
              allow: "ViewChannel",
            },
          ],
        });

        await textChannel.send({
          content: `<@&${circleRole.id}> The event ${title} is starting! Join <#${newChannel?.id}>!`,
        });
        return newChannel!.id;
      };

      const task: VCTask = {
        cron: new Date(Date.now() + timeTillStart * millisecondsInMinute),
        type: "circle_activity",
        payload: {
          eventStart,
          duration,
          circle: circleRole.id,
          channel: circleChannel,
          type: "start",
        },
      };

      await bot.managers.scheduler.createTask(task);
    } catch (e) {
      console.log(e);
    }
  }
}

const millisecondsInMinute = 60000;
