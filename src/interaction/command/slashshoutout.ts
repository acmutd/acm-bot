import SlashCommand, {
    SlashCommandContext,
  } from "../../api/interaction/slashcommand";
  import { InteractionContext } from "../../api/interaction/interaction";
  import { MessageEmbed } from "discord.js";
  
  export default class ReportCommand extends SlashCommand {
    public constructor() {
      super({
        name: "shoutout",
        description:
          "Shout out someone special."
      });
    }
  
    protected buildSlashCommand() {
      this.slashCommand
      .addSubcommand((subcommand) =>
        subcommand
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("User to mention")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("shoutout").setDescription("Type the text of the shoutout")
      );
    }
  
    public async handleInteraction({
      bot,
      interaction,
    }: SlashCommandContext): Promise<void> {
      
      // Send embed with instructions on reporting a specific message
      await interaction.reply({  });
    }
  }
  