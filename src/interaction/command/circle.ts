import { CIRCLE_PERMS } from "./../../util/perms";
import { ChannelType, OverwriteType } from "discord-api-types/v10";
import {
  ChatInputCommandInteraction,
  ColorResolvable,
  Guild,
  GuildMember,
  Message,
  Role,
  TextBasedChannel,
  TextChannel,
} from "discord.js";

import Bot from "../../api/bot";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { CircleData } from "../../api/schema";
import { settings } from "../../settings";

export default class CircleCommand extends SlashCommand {
  public constructor() {
    super({
      name: "circle",
      description: "A suite of command that manage ACM Community Circles.",
      permissions: CIRCLE_PERMS,
    });
    // Adding "add" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      return (
        subcommand
          .setName("add")
          .setDescription("Add a new circle.")
          // Name, description, color, emoji, graphic, and owner
          .addStringOption((option) => {
            return option
              .setName("name")
              .setDescription("The name of the circle.")
              .setRequired(true);
          })
          .addStringOption((option) => {
            return option
              .setName("description")
              .setDescription("The description of the circle.")
              .setRequired(true);
          })
          .addStringOption((option) => {
            return option
              .setName("color")
              .setDescription(
                "The color of the circle (used for role and embeds) in hex"
              )
              .setRequired(true);
          })
          .addStringOption((option) => {
            return option
              .setName("emoji")
              .setDescription(
                "The emoji of the circle (insert emoji, cannot be special server emojis)"
              )
              .setRequired(true);
          })
          .addStringOption((option) => {
            return option
              .setName("graphic")
              .setDescription("The graphic of the circle (url)")
              .setRequired(true);
          })
          .addUserOption((option) => {
            return option
              .setName("owner")
              .setDescription("The owner of the circle (mention them)")
              .setRequired(true);
          })
      );
    });
    // Adding "create channel" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      return (
        subcommand
          .setName("create-channel")
          .setDescription("Create a channel for a circle")

          // Set up all the options for the subcommand
          // Channel name, and circle to add them to
          .addStringOption((option) => {
            return option
              .setName("name")
              .setDescription("The name of the channel")
              .setRequired(true);
          })
          .addRoleOption((option) => {
            return option
              .setName("circle")
              .setDescription(
                "The circle to create the channel for (reference the role)"
              )
              .setRequired(true);
          })
      );
    });
    // Adding "repost" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      return subcommand
        .setName("repost")
        .setDescription("Repost the circle embeds");
    });
    // Adding "inactivity" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      return subcommand
        .setName("inactivity")
        .setDescription("Check for inactivity")
        .addRoleOption((option) => {
          return option
            .setName("circle")
            .setDescription(
              "The circle to check for inactivity (circle's role)"
            )
            .setRequired(true);
        })
        .addIntegerOption((option) => {
          return option
            .setName("days")
            .setDescription(
              "The number of days to check for inactivity (defaults to 30)"
            );
        });
    });
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    if (!interaction.isChatInputCommand()) return;
    const subComm = interaction.options.getSubcommand();
    switch (subComm) {
      case "add":
        await interaction.deferReply();
        await addCircle(bot, interaction);
        break;
      case "create-channel":
        await interaction.deferReply();
        await createExtraChannels(bot, interaction);
        break;
      case "repost":
        await interaction.deferReply();
        await bot.managers.circle.repost({ bot, interaction });
        break;
      case "inactivity":
        await interaction.deferReply({ ephemeral: true });
        await checkInactivity(bot, interaction);
        break;
    }
  }
}

async function createExtraChannels(
  bot: Bot,
  interaction: ChatInputCommandInteraction
) {
  const name = interaction.options.getString("name", true);
  const circleId = interaction.options.getRole("circle", true).id;
  const guild = interaction.guild!;

  const circle = bot.managers.database.cache.circles.get(circleId);
  if (!circle)
    return await interaction.editReply({
      content: "That circle does not exist.",
    });

  const channelName = `${circle.emoji} ${name}`;
  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: settings.circles.parentCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: "ViewChannel",
        type: OverwriteType.Role,
      },
      {
        id: circleId,
        allow: "ViewChannel",
        type: OverwriteType.Role,
      },
    ],
  });
  const res = await bot.managers.database.circleUpdate(circleId, {
    subChannels: [...(circle.subChannels || []), channel.id],
  });

  if (!res) {
    await channel.delete();
    return await interaction.editReply(
      "Created channel, but failed to update circle data. Deleting the channel."
    );
  }

  await interaction.editReply(`Created channel ${channel} for ${circle.name}.`);
}

async function addCircle(bot: Bot, interaction: ChatInputCommandInteraction) {
  const emoji = interaction.options.getString("emoji", true);
  if (!testEmoji(emoji))
    return await interaction.editReply("Invalid emoji, try again.");

  const circle = createCircleData(interaction);

  const circleOwner = interaction.options.getMember("owner") as GuildMember;
  const guild = interaction.guild!;

  // Create role
  const color = interaction.options.getString("color", true) as ColorResolvable;
  const circleRole = await guild.roles.create({
    name: `${circle.emoji} ${circle.name}`,
    mentionable: true,
    color,
  });

  // Give role to owner
  await circleOwner.roles.add(circleRole);

  const circleChannel = await createChannel(circle, circleRole, guild);
  const added = await handleAddCircle(bot, circle, circleRole, circleChannel);
  // If failed to add circle, delete the role and channel
  if (!added) {
    await circleRole.delete();
    await circleChannel.delete();
    return await interaction.editReply(
      "Failed to add circle please try again."
    );
  }

  await interaction.followUp(
    `Successfully created circle <@&${circleRole.id}>.`
  );
}

async function checkInactivity(
  bot: Bot,
  interaction: ChatInputCommandInteraction
) {
  const days = interaction.options.getInteger("days") || 30;
  const circleId = interaction.options.getRole("circle", true).id;

  const circle = bot.managers.database.cache.circles.get(circleId);
  if (!circle)
    return await interaction.editReply("That circle does not exist.");

  const channel = (await bot.channels.fetch(
    circle.channel!
  )) as TextBasedChannel;

  const sorted = await sortMessages(channel);
  for (const message of sorted.values()) {
    if (checkRecentMessage(message, days))
      return await interaction.editReply(
        `Last message in ${channel} was ${days} days ago.`
      );
  }

  if (!sorted[0])
    return await interaction.editReply(
      `No messages found in ${channel}. Last message was ${days} days ago.`
    );

  const diffDays = timeDifference(sorted[0]);

  await interaction.editReply(
    `Last message in ${channel} was ${diffDays} days ago.`
  );
}

const sortMessages = async (channel: TextBasedChannel) => {
  const messages = await channel.messages.fetch({ limit: 100 });
  const filtered = [...messages.values()].filter((msg) => !msg.author.bot);

  return filtered.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
};

const testEmoji = (emoji: string) => {
  const match = emoji.match(/\p{Extended_Pictographic}/gu);
  return match && match.length > 0;
};

const createCircleData = (
  interaction: ChatInputCommandInteraction
): CircleData => {
  return {
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true),
    emoji: interaction.options.getString("emoji", true),
    imageUrl: interaction.options.getString("graphic", true),
    createdOn: new Date(),
    owner: interaction.options.getUser("owner", true).id,
    subChannels: [],
  };
};
const createChannel = async (
  circle: CircleData,
  circleRole: Role,
  guild: Guild
) => {
  const channelName = `${circle.emoji} ${circle.name}`;
  const channelDesc = `🎗️: ${circle.description}`;
  return await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: channelDesc,
    parent: settings.circles.parentCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: "ViewChannel",
        type: OverwriteType.Role,
      },
      {
        id: circleRole.id,
        allow: "ViewChannel",
        type: OverwriteType.Role,
      },
    ],
  });
};
const handleAddCircle = async (
  bot: Bot,
  circle: CircleData,
  role: Role,
  channel: TextChannel
) => {
  circle["_id"] = role.id; // circles distinguished by unique role
  circle.channel = channel.id;
  return await bot.managers.database.circleAdd(circle);
};
const timeDifference = (latest: Message) => {
  const lastMessageTime = latest.createdTimestamp;
  const diff = new Date().getTime() - lastMessageTime;
  return Math.floor(diff / (1000 * 3600 * 24));
};
const checkRecentMessage = (message: Message, days: number) => {
  return (
    new Date().getTime() - message.createdAt.getTime() >
    days * 24 * 3600 * 1000 && !message.author.bot
  );
};
