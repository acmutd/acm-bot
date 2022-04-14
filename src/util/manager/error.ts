import Bot from "../../api/bot";
import { MessageEmbed } from "discord.js";
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
    const msg = message.toString();
    const guild = this.bot.guilds.resolve(this.bot.settings.guild);
    if (guild) {
      let embed = new MessageEmbed();
      embed.setTitle(`🤖 ${this.bot.user!.username} | Unhandled Rejection`);
      embed.addField("Error Message", msg);
      embed.setColor("RED");
      const errorChannel = await guild.channels.fetch(
        this.bot.settings.channels.error
      );
      if (errorChannel?.isText()) errorChannel.send({ embeds: [embed] });
    }
  }

  async handleErr(err: Error | null | undefined) {
    if (!err) return;
    const guild = this.bot.guilds.resolve(this.bot.settings.guild);
    if (guild) {
      // Create embed with basic information
      let embed = new MessageEmbed();
      embed.setTitle(`🤖 ${this.bot.user!.username} | Uncaught Exception`);
      embed.addField(
        "Error Message",
        (err.name || "UNKNOWN ERROR") + ": " + err.message
      );
      embed.setColor("RED");

      // Create text file containing stack trace, which is previewed on desktop clients
      const traceFile = {
        attachment: Buffer.from(err.stack!),
        name: "StackTrace.txt",
      };

      // Send error message
      const errorChannel = await guild.channels.fetch(
        this.bot.settings.channels.error
      );
      if (errorChannel?.isText())
        errorChannel.send({ embeds: [embed], files: [traceFile] });
    }
  }
}
