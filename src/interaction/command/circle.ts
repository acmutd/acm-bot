import Bot from "../../api/bot";
import {
  CategoryChannel,
  ColorResolvable,
  CommandInteraction,
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
    this.slashCommand.addSubcommand((subcommand) => {
      subcommand.setName("add");
      subcommand.setDescription("Add a new circle.");
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
  }

  protected buildSlashCommand() {}

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const { member, guild } = interaction;
    const subComm = interaction.options.getSubcommand();
    switch (subComm) {
      case "add":
        await interaction.deferReply();
        await addCircle(bot, interaction);
    }
  }
}

async function addCircle(bot: Bot, interaction: CommandInteraction) {
  // const wizard = new Wizard(msg, undefined, {
  //   title: "__**Circle Creation**__ ",
  // });
  // wizard.addNodes([
  //   new UserMentionWizardNode(wizard, {
  //     title: "Owner",
  //     description: `Who's the owner of the circle? (mention them)`,
  //   }),
  //   new TextWizardNode(wizard, {
  //     title: "Name",
  //     description: `What's the circle name?`,
  //   }),
  //   new TextWizardNode(wizard, {
  //     title: "Description",
  //     description: `What's the circle description?`,
  //   }),
  //   new ColorWizardNode(wizard, {
  //     title: "Color",
  //     description: `What's the circle color? (used for the embed & role)`,
  //   }),
  //   new EmojiWizardNode(wizard, {
  //     title: "Emoji",
  //     description: `What's the circle's emoji?`,
  //   }),
  //   new GraphicWizardNode(wizard, {
  //     title: "Image",
  //     description: `What's the circle's graphic/image? (url)`,
  //   }),
  // ]);
  // const res = await wizard.start();
  // if (res === false) return;
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
