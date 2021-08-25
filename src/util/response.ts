import {
  MessageEmbed,
  TextChannel,
  DMChannel,
  ColorResolvable,
  NewsChannel,
} from "discord.js";

const emoji = {
  error: {
    simple: "❌",
    embed: ":x:",
    color: "DARK_RED",
  },
  invalid: {
    simple: "🚫",
    embed: "🚫",
    color: "RED",
  },
  warning: {
    simple: "⚠️",
    embed: "⚠️",
    color: "YELLOW",
  },
  normal: {
    simple: "",
    embed: "",
    color: "DARKER_GREY",
  },
  success: {
    simple: "✅",
    embed: "✅",
    color: "GREEN",
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
  private simple(msg: string, emoji: string): string {
    return `${emoji} | ${msg}`;
  }
  private embed(
    msg: string,
    emojiSet: { simple: string; embed: string; color: ColorResolvable }
  ): MessageEmbed {
    return new MessageEmbed()
      .setDescription(`${emojiSet.embed} | **${msg}**`)
      .setColor(emojiSet.color);
  }
  public build(
    message: string,
    type?: ResponseType,
    format?: ResponseFormat
  ): string | MessageEmbed {
    type = type || "normal";
    format = format || this.format;
    let response: MessageEmbed | string = "";
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
      ? this.simple(message, em.simple)
      : this.embed(message, em);
  }
  public emit(
    channel: TextChannel | DMChannel | NewsChannel,
    message: string,
    type?: ResponseType,
    format?: ResponseFormat
  ): void {
    const response = this.build(message, type, format);
    typeof response == "string"
      ? channel.send(response)
      : channel.send({ embed: response });
  }
  public emitBuild(
    channel: TextChannel | DMChannel | NewsChannel,
    response: string | MessageEmbed
  ): void {
    typeof response == "string"
      ? channel.send(response)
      : channel.send({ embed: response });
  }
}
