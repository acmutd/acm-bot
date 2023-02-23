import { EmbedBuilder } from "discord.js";

import Bot from "../../api/bot";
import Manager from "../../api/manager";

export default class ErrorManager extends Manager {
  public bot: Bot;

  constructor(bot: Bot) {
    super(bot);
    this.bot = bot;
  }

  init() {
    process.on("unhandledRejection", (err: any) => this.handleMsg(err));
    process.on("uncaughtException", (err) => this.handleErr(err));
  }

  async handleMsg(message: {}) {
    if (!message) return;
    const msg = JSON.stringify(message);
    const guild = this.bot.guilds.resolve(this.bot.settings.guild);
    if (guild) {
      let embed = new EmbedBuilder()
        .setTitle(`🤖 ${this.bot.user!.username} | Unhandled Rejection`)
        .addFields({ name: "Error Message", value: msg })
        .setColor("Red");

      const errorChannel = await guild.channels.fetch(
        this.bot.settings.channels.error
      );
      if (errorChannel?.isTextBased() && !errorChannel.isVoiceBased())
        errorChannel.send({ embeds: [embed] });
    }
  }

  async handleErr(err: Error | null | undefined, msg?: string) {
    if (!err) return;
    console.error(err, err.stack);
    console.error(msg);
    const guild = this.bot.guilds.resolve(this.bot.settings.guild);
    if (guild) {
      // Create embed with basic information
      let embed = new EmbedBuilder()
        .setTitle(`🤖 ${this.bot.user!.username} | Uncaught Exception`)
        .addFields({
          name: "Error Message",
          value: (err.name || "UNKNOWN ERROR") + ": " + err.message,
        });
      if (msg)
        embed.addFields({ name: "More info", value: msg }).setColor("Red");

      // Create text file containing stack trace, which is previewed on desktop clients
      const traceFile = {
        attachment: Buffer.from(err.stack!),
        name: "StackTrace.txt",
      };

      // Send error message
      const errorChannel = await guild.channels.fetch(
        this.bot.settings.channels.error
      );
      if (errorChannel?.isTextBased() && !errorChannel.isVoiceBased())
        errorChannel.send({ embeds: [embed], files: [traceFile] });
    }
  }
}
