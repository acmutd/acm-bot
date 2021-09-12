import { Message } from "discord.js";
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

  public init() {}

  public handle(msg: Message) {
    if (msg.guild) {
      if (msg.channel.id == this.verificationChannelID && msg.member) {
        try {
          // Modify member nickname and roles
          msg.member.setNickname(msg.content);
          msg.member.roles.add(this.memberRoleID);
          msg.delete();

          // Add to firebase
          let map: any = {};
          map[msg.member.id] = msg.content;
          this.bot.managers.firestore.firestore
            ?.collection("discord")
            .doc("snowflake_to_name")
            .set(map, { merge: true });
          return;
        } catch (err) {
          this.bot.logger.error(err);
        }
      }
    }
  }
}
