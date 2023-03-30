import { GuildMember, Message } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

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

  public async handle(msg: Message) {
    // Check if the message is in the verification channel
    if (!msg.guild) return;
    if (msg.channel.id !== this.verificationChannelID) return;
    if (!msg.member) return;

    // Modify member nickname and roles
    try {
      await msg.member.setNickname(msg.content);
      await msg.member.roles.add(this.memberRoleID);
      await msg.delete();

      await this.bot.managers.firestore.verification(
        msg.member.id,
        msg.content
      );
    } catch (err: any) {
      this.bot.logger.error(err);
    }
  }

  // Return true if the user is already in the database
  public async handleRepeatJoin(member: GuildMember): Promise<boolean> {
    // Check if the user is already verified
    const isVerified = await this.bot.managers.firestore.isVerified(member.id);
    if (!isVerified) throw new Error("User is not verified");

    // Modify member nickname and roles
    const nick = await this.bot.managers.firestore.getVerifiedName(member.id);

    if (!nick) throw new Error("User is not verified");

    await member.setNickname(nick);
    await member.roles.add(this.memberRoleID);

    return true;
  }
}
