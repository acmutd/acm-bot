import Bot from "../../api/bot";
import {
  ColorResolvable,
  CommandInteraction,
  GuildMember,
  TextBasedChannel,
} from "discord.js";
import { settings } from "../../settings";
import { CircleData } from "../../api/schema";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import { PermissionFlagsBits } from "discord-api-types/v10";

const perms =
  PermissionFlagsBits.ManageRoles |
  PermissionFlagsBits.ManageChannels |
  PermissionFlagsBits.ManageMessages;

export default class CircleCommand extends SlashCommand {
  public constructor() {
    super({
      name: "circle",
      description: "A suite of command that manage ACM Community Circles.",
      permissions: perms,
    });

    // Adding "add" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("add");
      subcommand.setDescription("Add a new circle.");
      // Set up all the options for the subcommand
      // Name, description, color, emoji, graphic, and owner
      subcommand.addStringOption((option) => {
        option.setName("name");
        option.setDescription("The name of the circle.");
        option.setRequired(true);
        return option;
      });
      subcommand.addStringOption((option) => {
        option.setName("description");
        option.setDescription("The description of the circle.");
        option.setRequired(true);
        return option;
      });
      subcommand.addStringOption((option) => {
        option.setName("color");
        option.setDescription(
          "The color of the circle (used for role and embeds)"
        );
        option.setRequired(true);
        return option;
      });
      subcommand.addStringOption((option) => {
        option.setName("emoji");
        option.setDescription("The emoji of the circle");
        option.setRequired(true);
        return option;
      });
      subcommand.addStringOption((option) => {
        option.setName("graphic");
        option.setDescription("The graphic of the circle (url)");
        option.setRequired(true);
        return option;
      });
      subcommand.addUserOption((option) => {
        option.setName("owner");
        option.setDescription("The owner of the circle (mention them)");
        option.setRequired(true);
        return option;
      });
      return subcommand;
    });

    // Adding "create channel" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("create-channel");
      subcommand.setDescription("Create a channel for a circle");

      // Set up all the options for the subcommand
      // Channel name, and circle to add them to
      subcommand.addStringOption((option) => {
        option.setName("name");
        option.setDescription("The name of the channel");
        option.setRequired(true);
        return option;
      });
      subcommand.addRoleOption((option) => {
        option.setName("circle");
        option.setDescription(
          "The circle to create the channel for (reference the role)"
        );
        option.setRequired(true);
        return option;
      });

      return subcommand;
    });

    // Adding "repost" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("repost");
      subcommand.setDescription("Repost the circle embeds");
      return subcommand;
    });

    // Adding "inactivity" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("inactivity");
      subcommand.setDescription("Check for inactivity");

      subcommand.addRoleOption((option) => {
        option.setName("circle");
        option.setDescription(
          "The circle to check for inactivity (circle's role)"
        );
        option.setRequired(true);
        return option;
      });

      subcommand.addIntegerOption((option) => {
        option.setName("days");
        option.setDescription(
          "The number of days to check for inactivity (defaults to 30)"
        );
        return option;
      });

      return subcommand;
    });
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const subComm = interaction.options.getSubcommand();
    switch (subComm) {
      case "add":
        await interaction.deferReply();
        await addCircle(bot, interaction);
        break;
      case "create-channel":
        await interaction.deferReply();
        await createChannel(bot, interaction);
        break;
      case "repost":
        await bot.managers.circle.repost();
        await interaction.reply("Updated circle data");
        break;
      case "inactivity":
        await interaction.deferReply({ ephemeral: true });
        await checkInactivity(bot, interaction);
        break;
    }
  }
}

async function createChannel(bot: Bot, interaction: CommandInteraction) {
  const name = interaction.options.getString("name", true);
  const circleId = interaction.options.getRole("circle", true).id;
  const guild = interaction.guild!;

  const circle = bot.managers.database.cache.circles.get(
    circleId
  ) as CircleData;
  if (!circle) {
    await interaction.editReply({
      content: "That circle does not exist.",
    });
    return;
  }
  const channelName = `${circle.emoji} ${name}`;
  const channel = await guild.channels.create(channelName, {
    type: "GUILD_TEXT",
    parent: settings.circles.parentCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ["VIEW_CHANNEL"],
        type: "role",
      },
      {
        id: circleId,
        allow: ["VIEW_CHANNEL"],
        type: "role",
      },
    ],
  });
  const newSub = [...circle.subChannels, channel.id];
  const res = await bot.managers.database.circleUpdate(circleId, {
    subChannels: newSub,
  });

  if (!res) {
    await interaction.editReply({
      content:
        "Created channel, but failed to update circle data. Deleting the channel.",
    });
    await channel.delete();
    return;
  }

  await interaction.editReply({
    content: `Created channel ${channel} for ${circle.name}.`,
  });
}

async function addCircle(bot: Bot, interaction: CommandInteraction) {
  // Parse/resolve circle data
  const circle: CircleData = {
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true),
    emoji: interaction.options.getString("emoji", true),
    imageUrl: interaction.options.getString("graphic", true),
    createdOn: new Date(),
    owner: interaction.options.getUser("owner", true).id,
    subChannels: [],
  };
  const circleOwner = interaction.options.getMember("owner", true);
  const guild = interaction.guild!;

  // Create role
  const color = interaction.options.getString("color", true) as ColorResolvable;
  const circleRole = await guild.roles.create({
    name: `${circle.emoji} ${circle.name}`,
    mentionable: true,
    color,
  });

  // Give role to owner
  await (circleOwner as GuildMember).roles.add(circleRole);

  // Create channel with correct perms
  const channelName = `${circle.emoji} ${circle.name}`;
  const channelDesc = `🎗️: ${circleRole.name}`;
  const circleChannel = await guild.channels.create(channelName, {
    type: "GUILD_TEXT",
    topic: channelDesc,
    parent: settings.circles.parentCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ["VIEW_CHANNEL"],
        type: "role",
      },
      {
        id: circleRole.id,
        allow: ["VIEW_CHANNEL"],
        type: "role",
      },
    ],
  });

  // Add circle to database
  circle["_id"] = circleRole.id; // circles distinguished by unique role
  circle.channel = circleChannel.id;
  const added = await bot.managers.database.circleAdd(circle);
  if (!added) {
    interaction.editReply("An error occurred while adding the circle.");
    await circleRole.delete();
    await circleChannel.delete();
    return;
  }

  await interaction.editReply(
    `Successfully created circle <@&${circleRole.id}>.`
  );
}

async function checkInactivity(bot: Bot, interaction: CommandInteraction) {
  let days = interaction.options.getInteger("days");
  if (!days) days = 30;

  const circleId = interaction.options.getRole("circle", true).id;

  // Fetch last 100 messages from circle channel
  const circle = bot.managers.database.cache.circles.get(circleId);

  if (!circle) {
    await interaction.editReply("That circle does not exist.");
    return;
  }

  const channel = (await bot.channels.fetch(
    circle.channel!
  )) as TextBasedChannel;

  const messages = await channel.messages.fetch({ limit: 100 });

  // Sort from newest to oldest
  const sorted = messages.sort(
    (a, b) => b.createdTimestamp - a.createdTimestamp
  );

  for (const message of sorted.values()) {
    if (
      new Date().getTime() - message.createdAt.getTime() >
        days * 24 * 3600 * 1000 &&
      !message.author.bot
    ) {
      await interaction.editReply(
        `Last message in ${channel} was ${days} days ago.`
      );
      return;
    }
  }

  // Check if all messages are from bots
  if (sorted.every((m) => m.author.bot)) {
    await interaction.editReply(`All messages in ${channel} are from bots.`);
    return;
  }
  // get latest non-bot message
  const latest = sorted.find((m) => !m.author.bot);
  const lastMessageTime = latest?.createdAt.getTime() || 0;

  const diff = new Date().getTime() - lastMessageTime;
  const diffDays = Math.floor(diff / (1000 * 3600 * 24));

  await interaction.editReply(
    `Last message in ${channel} was ${diffDays} days ago.`
  );
}
