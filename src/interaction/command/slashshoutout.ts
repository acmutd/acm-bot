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
          "Shout out someone special.",
        optionName: "user",
        optionDescription: "mention the user you want to shout out."

      });
    }
  
    protected buildSlashCommand() {}
  
    public async handleInteraction({
      bot,
      interaction,
    }: SlashCommandContext): Promise<void> {
      
      // Send embed with instructions on reporting a specific message
      await interaction.reply({  });
    }
  }
  