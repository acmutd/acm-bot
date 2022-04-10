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
      .addUserOption(option => 
        option
        .setName("user")
        .setDescription("User to shout out")
        .setRequired(true)
        )
      .addStringOption(option =>
        option
        .setName("shoutout")
        .setDescription("Reason for the shoutout")
        .setRequired(true)
        )
    }
  
    public async handleInteraction({
      bot,
      interaction,
    }: SlashCommandContext): Promise<void> {
      
      // Send embed with instructions on reporting a specific message
      await interaction.reply({  });
    }
  }
  