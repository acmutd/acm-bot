import { Message, StageChannel, VoiceChannel, VoiceState } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import { settings } from "../../settings";

interface VoiceLogData {
  userID: string;
  time: number;
  joined: boolean;
}

export default class ActivityManager extends Manager {
  public enabled: boolean;
  public activityLog: Map<string, number>;
  public voiceLog: Map<string, Array<VoiceLogData>>;

  constructor(bot: Bot) {
    super(bot);
    this.enabled = false;
    this.activityLog = new Map<string, number>();
    this.voiceLog = new Map<string, Array<VoiceLogData>>();
  }
  init() {}
  async handleVoiceStateUpdate(oldMember: VoiceState, newMember: VoiceState) {
    const oldVC = oldMember.channel;
    const newVC = newMember.channel;
    if (oldVC) {
      const data: VoiceLogData = {
        userID: oldMember.id,
        time: Date.now(),
        joined: false,
      };
      this.voiceLog.get(oldVC.id)?.push(data);
    }
    if (newVC) {
      const data: VoiceLogData = {
        userID: newMember.id,
        time: Date.now(),
        joined: true,
      };
      this.voiceLog.get(newVC.id)?.push(data);
    }
  }

  startVoiceEvent(vc: VoiceChannel | StageChannel): boolean {
    if (this.voiceLog.has(vc.id)) return false;
    const data = [];
    const now = Date.now();
    for (const id of vc.members.keys()) {
      data.push({
        userID: id,
        time: now,
        joined: true,
      });
    }
    this.voiceLog.set(vc.id, data);
    return true;
  }
  stopVoiceEvent(
    vc: VoiceChannel | StageChannel
  ): Map<string, number> | undefined {
    if (!this.voiceLog.has(vc.id)) return undefined;

    const stats = this.voiceEventStats(vc);
    this.voiceLog.delete(vc.id);
    return stats;
  }
  voiceEventStats(
    vc: VoiceChannel | StageChannel
  ): Map<string, number> | undefined {
    if (!this.voiceLog.has(vc.id)) return undefined;
    const data = [...this.voiceLog.get(vc.id)!];
    const now = Date.now();

    for (const id of vc.members.keys()) {
      data.push({
        userID: id,
        time: now,
        joined: false,
      });
    }
    const stats = new Map<string, number>();
    const joinTime = new Map<string, number>();
    for (const dat of data) {
      const id = dat.userID;
      const time = dat.time;
      if (joinTime.has(id)) {
        if (!stats.has(id)) stats.set(id, 0);
        stats.set(id, stats.get(id)! + (time - joinTime.get(id)!));
        joinTime.delete(id);
      } else {
        joinTime.set(id, time);
      }
    }
    return stats;
  }
  async handleMessage(msg: Message): Promise<void> {
    const cooldown = 10 * 60;
    let indicators = this.bot.managers.indicator;

    if (msg.author.bot) return;
    if (msg.content.startsWith(settings.prefix)) return;
    if (msg.guild?.id !== settings.guild) return;
    if (!this.enabled) return;

    if (
      (indicators.hasKey("textActivity", msg.author.id) &&
        msg.createdTimestamp >
          indicators.getValue("textActivity", msg.author.id)! +
            cooldown * 1000) ||
      !indicators.hasKey("textActivity", msg.author.id)
    ) {
      indicators.setKeyValue(
        "textActivity",
        msg.author.id,
        msg.createdTimestamp
      );
      let { success } = await this.bot.managers.points.awardPoints(
        1,
        "Discord",
        new Set<string>([msg.author.id])
      );
      if (success.length === 0) {
      } else {
        console.log(
          `${new Date().toLocaleTimeString()}: ${
            msg.author.tag
          } was awarded 1pt for activity (${msg.createdTimestamp})`
        );
      }
    }
  }
  enableTracking() {
    this.enabled = true;
  }
  disableTracking() {
    this.enabled = false;
  }
}
