import SlashCommand, {
    SlashCommandContext,
  } from "../../api/interaction/slashcommand";
  import { InteractionContext } from "../../api/interaction/interaction";
  import { MessageEmbed } from "discord.js";
  import { settings } from "../../../src/settings";
  
  export default class ShoutoutCommand extends SlashCommand {
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
  
    // Interaction Handled !
    public async handleInteraction({
      bot,
      interaction,
    }: SlashCommandContext): Promise<void> {
      
      const channel = settings.channels
      
      let embed = new MessageEmbed({
        title: "Shouting out User"
      });
      
      //await channel.send({ embeds: [embed] });
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
  