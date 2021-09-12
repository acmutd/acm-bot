import Event from "../api/event";
import Bot from "../api/bot";
import { VoiceState } from "discord.js";

export default class VoiceStateUpdateEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "voiceStateUpdate");
  }

  public async emit(bot: Bot, oldMember: VoiceState, newMember: VoiceState) {
    bot.managers.activity.handleVoiceStateUpdate(oldMember, newMember);
  }
}
