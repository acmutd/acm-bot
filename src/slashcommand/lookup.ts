import SlashCommand from "../api/slashcommand";

export default class LookupCommand extends SlashCommand {
  public constructor() {
    super({
      name: "admin",
      description: "Staff commands",
      permissions: [
        {
          id: "312383932870033408",
          type: "USER",
          permission: true,
        },
      ],
    });

    this.slashCommand
      .addSubcommand((subcommand) =>
        subcommand
          .setName("lookup")
          .setDescription("Look up a user's name")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("User to look up")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("foobar").setDescription("test")
      );
  }
}
