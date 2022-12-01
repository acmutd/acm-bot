import { ColorResolvable, EmbedBuilder, TextBasedChannel } from "discord.js";

const emoji = {
  error: {
    simple: "❌",
    embed: ":x:",
    color: "DARK_RED" as ColorResolvable,
  },
  invalid: {
    simple: "🚫",
    embed: "🚫",
    color: "RED" as ColorResolvable,
  },
  warning: {
    simple: "⚠️",
    embed: "⚠️",
    color: "YELLOW" as ColorResolvable,
  },
  normal: {
    simple: "",
    embed: "",
    color: "DARKER_GREY" as ColorResolvable,
  },
  success: {
    simple: "✅",
    embed: "✅",
    color: "GREEN" as ColorResolvable,
  },
};

export type ResponseType =
  | "error"
  | "invalid"
  | "warning"
  | "normal"
  | "success";
export type ResponseFormat = "simple" | "embed";

export default class ResponseUtil {
  public format: ResponseFormat;

  constructor(format: ResponseFormat) {
    this.format = format;
  }

  private static simple(msg: string, emoji: string): string {
    return `${emoji} | ${msg}`;
  }

  private static embed(
    msg: string,
    emojiSet: { simple: string; embed: string; color: ColorResolvable }
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setDescription(`${emojiSet.embed} | **${msg}**`)
      .setColor(emojiSet.color);
  }

  public build(
    message: string,
    type?: ResponseType,
    format?: ResponseFormat
  ): string | EmbedBuilder {
    type = type || "normal";
    format = format || this.format;
    let em: { simple: string; embed: string; color: ColorResolvable };
    switch (type) {
      case "error":
        em = emoji.error;
        break;
      case "invalid":
        em = emoji.invalid;
        break;
      case "warning":
        em = emoji.warning;
        break;
      case "normal":
        em = emoji.normal;
        break;
      case "success":
        em = emoji.success;
        break;
      default:
        return "";
    }
    return format == "simple"
      ? ResponseUtil.simple(message, em.simple)
      : ResponseUtil.embed(message, em);
  }

  public emit(
    channel: TextBasedChannel,
    message: string,
    type?: ResponseType,
    format?: ResponseFormat
  ): void {
    const response = this.build(message, type, format);
    typeof response == "string"
      ? channel.send(response)
      : channel.send({ embeds: [response] });
  }

  public emitBuild(
    channel: TextBasedChannel,
    response: string | EmbedBuilder
  ): void {
    typeof response == "string"
      ? channel.send(response)
      : channel.send({ embeds: [response] });
  }
}
