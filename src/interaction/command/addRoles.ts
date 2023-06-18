import { GuildMember } from "discord.js";
import SlashCommand, {
  MANAGER_PERMS,
  SlashCommandContext,
} from "../../api/interaction/slashcommand";

export default class RoleCommand extends SlashCommand {
  public constructor() {
    super({
      name: "role",
      description: "Utilities to add/remove roles",
      permissions: MANAGER_PERMS,
    });

    // Adding members
    this.slashCommand.addSubcommand((opt) =>
      opt
        .setName("add")
        .setDescription("Adds roles to multiple users")
        .addRoleOption((subOpt) =>
          subOpt
            .setName("role")
            .setDescription("The role to add")
            .setRequired(true)
        )
        .addAttachmentOption((subOpt) =>
          subOpt
            .setName("list")
            .setDescription(
              "A list of users by tag ([name]#[discriminator]) separated by new lines"
            )
            .setRequired(true)
        )
    );

    // Removing members
    this.slashCommand.addSubcommand((opt) =>
      opt
        .setName("remove")
        .setDescription("Removes roles from multiple users")
        .addRoleOption((subOpt) =>
          subOpt
            .setName("role")
            .setDescription("The role to remove")
            .setRequired(true)
        )
        .addAttachmentOption((subOpt) =>
          subOpt
            .setName("list")
            .setDescription(
              "A list of users by tag ([name]#[discriminator]) separated by new lines"
            )
            .setRequired(true)
        )
    );
  }

  public async handleInteraction({ bot, interaction }: SlashCommandContext) {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "add":
        return await this.handleAdd({ bot, interaction });
      case "remove":
        return await this.handleRemove({ bot, interaction });
      default:
        return await interaction.reply("Invalid subcommand");
    }
  }

  private async handleAdd({ bot, interaction }: SlashCommandContext) {
    await interaction.deferReply();
    const roleId = interaction.options.getRole("role", true).id;
    const list = interaction.options.getAttachment("list", true);
    // Check if the file is a txt file
    if (!list.contentType?.includes("text"))
      return await interaction.editReply("Invalid file type");

    const guild = bot.guilds.cache.get(interaction.guildId!);

    if (!guild) {
      bot.managers.error.handleErr(
        new Error("Guild not found"),
        "add role command"
      );
      return await interaction.followUp("Guild not found");
    }

    const role = guild.roles.cache.get(roleId);

    if (!role) {
      bot.managers.error.handleErr(
        new Error("Role not found"),
        "add role command"
      );
      return await interaction.followUp("Role not found");
    }

    // Data should come in as a string separated by new lines
    // [name]#[discriminator]
    const url = list.url;
    const res = await fetch(url).then((res) => res.text());
    const data = res.split("\n").filter((line) => line !== "");

    const guildMembers = [...(await guild.members.fetch()).values()];
    const members: GuildMember[] = [];
    for (const member of data) {
      const [name, discriminator] = member.split("#");
      const user = guildMembers.find(
        (member) =>
          member.user.username === name &&
          member.user.discriminator === discriminator
      );

      if (user) members.push(user);
      else await interaction.followUp(`User not found: ${member}`);
    }

    try {
      const promises = members.map((member) => member.roles.add(role));
      await Promise.allSettled(promises);
    } catch (err) {
      bot.managers.error.handleErr(err as any, "add role command");
      return await interaction.followUp("Error fetching members");
    }

    await interaction.followUp("Done");
  }

  private async handleRemove({ bot, interaction }: SlashCommandContext) {
    await interaction.deferReply();
    const roleId = interaction.options.getRole("role", true).id;
    const list = interaction.options.getAttachment("list", true);

    // Check if the file is a txt file
    if (!list.contentType?.includes("text"))
      return await interaction.editReply("Invalid file type");

    const guild = bot.guilds.cache.get(interaction.guildId!);

    if (!guild) {
      bot.managers.error.handleErr(
        new Error("Guild not found"),
        "add role command"
      );
      return await interaction.followUp("Guild not found");
    }

    const role = guild.roles.cache.get(roleId);

    if (!role) {
      bot.managers.error.handleErr(
        new Error("Role not found"),
        "add role command"
      );
      return await interaction.followUp("Role not found");
    }

    // Data should come in as a string separated by new lines
    // [name]#[discriminator]
    const url = list.url;
    const res = await fetch(url).then((res) => res.text());
    const data = res.split("\n").filter((line) => line !== "");

    const guildMembers = [...(await guild.members.fetch()).values()];
    const members: GuildMember[] = [];
    for (const member of data) {
      const [name, discriminator] = member.split("#");
      const user = guildMembers.find(
        (member) =>
          member.user.username === name &&
          member.user.discriminator === discriminator
      );
      if (user) members.push(user);
      else await interaction.followUp(`User not found: ${member}`);
    }
    try {
      const promises = members.map((member) => member.roles.remove(role));
      await Promise.allSettled(promises);
    } catch (err) {
      bot.managers.error.handleErr(err as any, "add role command");
      return await interaction.followUp("Error fetching members");
    }

    await interaction.followUp("Done");
  }
}
