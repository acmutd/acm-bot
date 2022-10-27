import Bot from "../../api/bot";
import {
  CategoryChannel,
  ColorResolvable,
  CommandInteraction,
  GuildMember,
  OverwriteResolvable,
} from "discord.js";
import { settings } from "../../settings";
import { CircleData } from "../../api/schema";
import SlashCommand, {
  SlashCommandContext,
} from "../../api/interaction/slashcommand";
import {
  APIApplicationCommandOptionChoice,
  PermissionFlagsBits,
} from "discord-api-types/v10";

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

        option.addChoices(...colorOptions);
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
      content: "Failed to update database",
    });
    return;
  }

  await interaction.editReply({
    content: `Created channel ${channel} for ${circle.name}.`,
  });
}

async function addCircle(bot: Bot, interaction: CommandInteraction) {
  const circle: CircleData = {
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true),
    emoji: interaction.options.getString("emoji", true),
    imageUrl: interaction.options.getString("graphic", true),
    createdOn: new Date(),
    owner: interaction.options.getUser("owner", true).id,
    subChannels: [],
  };
  const owner = interaction.options.getMember("owner", true);

  const color = interaction.options.getString("color", true) as ColorResolvable;

  const guild = interaction.guild!;
  const circleRole = await guild.roles.create({
    name: `${circle.emoji} ${circle.name}`,
    mentionable: true,
    color,
  });
  const permissions: OverwriteResolvable[] = [
    {
      id: interaction.guild!.id,
      deny: ["VIEW_CHANNEL"],
      type: "role",
    },
    {
      id: circleRole,
      allow: ["VIEW_CHANNEL"],
      type: "role",
    },
  ];
  const circleCategory = (await interaction.guild!.channels.fetch(
    settings.circles.parentCategory
  )) as CategoryChannel;
  const desc = `🎗️: ${circleRole.name}`;
  const circleChannel = await interaction.guild!.channels.create(
    `${circle.emoji} ${circle.name}`,
    {
      type: "GUILD_TEXT",
      topic: desc,
      parent: circleCategory,
      permissionOverwrites: permissions,
    }
  );
  circle["_id"] = circleRole.id;
  circle.channel = circleChannel.id;
  circle.owner = (owner as GuildMember).id;
  await (owner as GuildMember).roles.add(circleRole);
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

const colors: ColorResolvable[] = [
  "DEFAULT",
  "AQUA",
  "GREEN",
  "BLUE",
  "PURPLE",
  "GOLD",
  "ORANGE",
  "RED",
  "GREY",
  "DARKER_GREY",
  "NAVY",
  "DARK_AQUA",
  "DARK_GREEN",
  "DARK_BLUE",
  "DARK_PURPLE",
  "DARK_GOLD",
  "DARK_ORANGE",
  "DARK_RED",
  "DARK_GREY",
  "LIGHT_GREY",
  "DARK_NAVY",
  "LUMINOUS_VIVID_PINK",
  "DARK_VIVID_PINK",
];

const renamed = colors.map((color) => [
  color
    .toString()
    .split("_")
    .map((s) => s[0] + s.slice(1).toLowerCase())
    .join(" "),
  color,
]);

const colorOptions = renamed.map((color) => ({
  name: color[0].toString(),
  value: color[1].toString(),
}));
