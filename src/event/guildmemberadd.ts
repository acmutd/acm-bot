import Event from "../api/event";
import Bot from "../api/bot";
import { GuildMember } from "discord.js";
import { EmbedBuilder } from "@discordjs/builders";

export default class GuildMemberAddEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "guildMemberAdd");
  }

  public async emit(bot: Bot, member: GuildMember) {
    const embed = await createEmbed(bot, member);

    try {
      const channel = await member.createDM();
      channel?.send({ embeds: [embed] });
    } catch (e) {
      bot.managers.error.handleErr(
        e as Error,
        "Error sending welcome message."
      );
      console.error(e);
    }
  }
}

const createEmbed = async (
  bot: Bot,
  member: GuildMember
): Promise<EmbedBuilder> => {
  const isRepeatJoin = await bot.managers.verification.handleRepeatJoin(member);

  return new EmbedBuilder()
    .setTitle(
      `**Welcome${isRepeatJoin ? " back" : ""} to the ACM Discord Server!** 🎉`
    )
    .setAuthor({
      name: `The Association for Computing Machinery`,
      iconURL: "https://www.acmutd.co/png/acm-light.png",
      url: "https://acmutd.co/",
    })
    .setColor(0xec7621)
    .setFooter({
      text: `Powered by ACM`,
      iconURL: bot.user?.avatarURL() ?? "",
    })
    .addFields(
      isRepeatJoin
        ? [{ name: `You are already verified!`, value: `Welcome back!` }]
        : [
            {
              name: `Step 1: Verify! The links below will become active once you verify.`,
              value: `<#${bot.settings.channels.verification}>`,
            },
            {
              name: `Step 2: Get roles!`,
              value: `<#${bot.settings.channels.roles}>`,
            },
            {
              name: `Step 3: Join Circles (interest groups)!`,
              value: `<#${bot.settings.circles.joinChannel}>`,
            },
          ]
    );
};
