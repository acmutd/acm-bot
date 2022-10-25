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

export default class CircleCommand extends SlashCommand {
  public constructor() {
    super({
      name: "circle",
      description: "A suite of command that manage ACM Community Circles.",
      permissions: [
        { id: settings.roles.director, permission: true, type: "ROLE" },
      ],
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

        option.addChoices(colorOptions as [string, string][]);
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
    // Adding "add leader" subcommand
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("add-leader");
      subcommand.setDescription("Add a leader to a circle.");

      // Set up all the options for the subcommand
      // User to add, and circle to add them to
      subcommand.addUserOption((option) => {
        option.setName("leader");
        option.setDescription("The leader to add to the circle (mention them)");
        option.setRequired(true);
        return option;
      });
      subcommand.addRoleOption((option) => {
        option.setName("circle");
        option.setDescription(
          "The circle to add the leader to (reference the role)"
        );
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
  }

  protected buildSlashCommand() {}

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const subComm = interaction.options.getSubcommand();
    switch (subComm) {
      case "add":
        await interaction.deferReply();
        await addCircle(bot, interaction);
        break;
      case "add-leader":
        await interaction.deferReply();
        await addLeader(bot, interaction);
        break;
      case "create-channel":
        await interaction.deferReply();
        await createChannel(bot, interaction);
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

  bot.managers.database.circleUpdate(circleId, {
    ...circle,
    subChannels: [...circle.subChannels, channel.id],
  });

  await interaction.editReply({
    content: `Created channel ${channel} for ${circle.name}.`,
  });
}

async function addLeader(bot: Bot, interaction: CommandInteraction) {
  const leader = interaction.options.getUser("leader", true);
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

  const member = await guild.members.fetch(leader.id);
  if (!member) {
    await interaction.editReply({
      content: "That user is not in this server.",
    });
    return;
  }
  const res = await addLeaderRole(interaction, circle, member);
  if (!res) return;
  await bot.managers.database.circleUpdate(circleId, {
    ...circle,
    leaders: [...circle.leaders, leader.id],
  });
  await interaction.editReply({
    content: `Added ${leader} as a leader of ${circle.name}.`,
  });
}

async function addLeaderRole(
  interaction: CommandInteraction,
  circle: CircleData,
  member: GuildMember
) {
  const circleRole = await interaction.guild!.roles.fetch(circle._id!)!;
  const roleName = `${circle.emoji} ${circle.name} Leader`;
  const role = interaction.guild!.roles.cache.find(
    (role) => role.name === roleName
  );
  if (!role) {
    const newRole = await interaction.guild!.roles.create({
      name: roleName,
      color: circleRole?.color,
      hoist: true,
      mentionable: true,
    });
    await member.roles.add(newRole);
    return true;
  }
  const sender = await interaction.guild!.members.fetch(interaction.user.id);
  if (!sender.roles.cache.has(role.id)) {
    await interaction.editReply("You do not have permission to do that.");
    return false;
  } else {
    await member.roles.add(role);
    return true;
  }
}

async function addCircle(bot: Bot, interaction: CommandInteraction) {
  const circle: CircleData = {
    name: interaction.options.getString("name", true),
    description: interaction.options.getString("description", true),
    emoji: interaction.options.getString("emoji", true),
    imageUrl: interaction.options.getString("graphic", true),
    createdOn: new Date(),
    owner: interaction.options.getUser("owner", true).id,
    leaders: [],
    subChannels: [],
  };
  const owner = await bot.users.fetch(circle.owner!);

  if (owner.bot) {
    await interaction.editReply("The owner cannot be a bot.");
    return;
  }

  const color = interaction.options.getString("color", true) as ColorResolvable;

  const guild = interaction.guild!;
  const circleRole = await guild.roles.create({
    name: `${circle.emoji} ${circle.name}`,
    mentionable: true,
    color,
  });
  const ownerMember = await guild.members.fetch(circle.owner!);
  await ownerMember.roles.add(circleRole);
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
  circle.owner = owner.id;
  const added = await bot.managers.database.circleAdd(circle);
  if (!added) {
    interaction.editReply("An error occurred while adding the circle.");
    await circleRole.delete();
    await circleChannel.delete();
    return;
  }

  addLeaderRole(interaction, circle, ownerMember);

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

const colorOptions: [ColorResolvable, string][] = colors.map((color) => [
  color,
  color.toString(),
]);
