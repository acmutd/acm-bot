import { ButtonInteraction, GuildMember, Message } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import VerifyModal from "../../interaction/modal/verify";

export default class VerificationManager extends Manager {
  private readonly verificationChannelID: string;
  private readonly memberRoleID: string;

  constructor(bot: Bot) {
    super(bot);
    this.verificationChannelID = bot.settings.channels.verification;
    this.memberRoleID = bot.settings.roles.member;

    this.bot = bot;
  }

  public async init() {}

  public async handle(interaction: ButtonInteraction) {
    if (!interaction.member)
      return await interaction.reply({
        content:
          "There was an error verifying you. Please contact an administrator.",
        ephemeral: true,
      });
    const member = interaction.member as GuildMember;
    const verifyModal = new VerifyModal();
    await interaction.showModal(verifyModal);

    const res = await interaction.awaitModalSubmit({
      time: 20000,
      idle: 20000,
    });
    if (!res) {
      await interaction.reply({
        content: "Verification timed out.",
        ephemeral: true,
      });
      return;
    }
    try {
      const nick = res.fields.getTextInputValue("verify-text").trim();

      if (nick.length > 32 || nick.length < 1) {
        return await res.reply({
          content: "Your nickname must be between 1 and 32 characters.",
          ephemeral: true,
        });
      }

      await member.setNickname(nick);
      await member.roles.add(this.memberRoleID);

      await this.bot.managers.firestore.verification(member.id, nick);
      return await res.reply({
        content: "You have been verified!",
        ephemeral: true,
      });
    } catch (e: any) {
      this.bot.logger.error(e);
    }
    await res.reply({
      content: "There was an error verifying you.",
      ephemeral: true,
    });
  }

  // Return true if the user is already in the database
  public async handleRepeatJoin(member: GuildMember): Promise<boolean> {
    // Check if the user is already verified
    const name = await this.bot.managers.firestore.isVerified(member.id);
    if (!name) return false;

    // Modify member nickname and roles
    try {
      await member.setNickname(name);
      await member.roles.add(this.memberRoleID);
      return true;
    } catch (err: any) {
      this.bot.managers.error.handleErr(err, "Error verifying user.");
    }
    return true;
  }
}
