import { Collection, GuildMember, Message, VoiceChannel, VoiceState } from 'discord.js';
import ACMClient from '../Bot';
import { settings } from '../../botsettings';

interface VoiceLogData {
    userID: string;
    time: number;
    joined: boolean;
}

export default class ActivityManager {
    public client: ACMClient;
    public enabled: boolean;
    public activityLog: Map<string, number>;
    public voiceLog: Map<string, Array<VoiceLogData>>;

    constructor(client: ACMClient) {
        this.client = client;
        this.enabled = false;
        this.activityLog = new Map<string, number>();
        this.voiceLog = new Map<string, Array<VoiceLogData>>(); // voice channel ID → array of logs
    }

    async handleVoiceStateUpdate(oldMember: VoiceState, newMember: VoiceState) {
        //console.log("OLD: " + JSON.stringify(oldMember, null, 2));
        //console.log("NEW: " + JSON.stringify(newMember, null, 2));
        const oldVC = oldMember.channel;
        const newVC = newMember.channel;
        if (oldVC) {
            const data: VoiceLogData = {
                userID: oldMember.id,
                time: Date.now(),
                joined: false
            }
            this.voiceLog.get(oldVC.id)?.push(data);
        }
        if (newVC) {
            const data: VoiceLogData = {
                userID: newMember.id,
                time: Date.now(),
                joined: true
            }
            this.voiceLog.get(newVC.id)?.push(data);
        }
    }
    
    /**
     * Starts logging for a new VC Event
     * @param voiceChannel 
     * @returns True if successful. False otherwise.
     */
    startVoiceEvent(voiceChannel: VoiceChannel): boolean {
        if (this.voiceLog.has(voiceChannel.id)) return false;
        const voiceData = new Array();
        const now = Date.now();
        for (const id of voiceChannel.members.keys()) {
            voiceData.push({
                userID: id,
                time: now,
                joined: true
            });
        }
        this.voiceLog.set(voiceChannel.id, voiceData);
        return true;
    }

    /**
     * Stops logging for a new VC Event
     * @param voiceChannel 
     * @returns True if successful. False otherwise.
     */
    stopVoiceEvent(voiceChannel: VoiceChannel): Map<string, number> | undefined {
        if (!this.voiceLog.has(voiceChannel.id)) return undefined;
        const voiceData = this.voiceLog.get(voiceChannel.id)!;
        const now = Date.now();
        console.log(JSON.stringify(voiceData, null, 2));

        for (const id of voiceChannel.members.keys()) {
            voiceData.push({
                userID: id,
                time: now,
                joined: false
            });
        }

        const stats = new Map<string, number>();
        const joinTime = new Map<string, number>();
        for (const data of voiceData) {
            const id = data.userID;
            console.log(id);
            const time = data.time;
            if (joinTime.has(id)) {
                if (!stats.has(id)) stats.set(id, 0);
                stats.set(id, stats.get(id)! + (time - joinTime.get(id)!));
                joinTime.delete(id);
                continue;
            } else {
                joinTime.set(id, time);
            }
        }
    
        this.voiceLog.delete(voiceChannel.id);
        return stats;
    }

    async handleMessage(msg: Message) {
        const cooldown = 10 * 60;
        let indicators = this.client.indicators;
        
        if (msg.author.bot) return; // don't process bots
        if (msg.content.startsWith(settings.prefix)) return; // don't count commands
        if (msg.guild?.id != settings.guild) return; // don't count anything outside of guild, including DMs
        if (!this.enabled) return;

        // add points if cooldown has expired or if first message
        if (
            (indicators.hasKey('textActivity', msg.author.id) &&
                msg.createdTimestamp > indicators.getValue('textActivity', msg.author.id)! + cooldown * 1000) ||
            !indicators.hasKey('textActivity', msg.author.id)
        ) {
            indicators.setKeyValue('textActivity', msg.author.id, msg.createdTimestamp);
            let { success, failure } = await this.client.services.points.awardPoints(
                1,
                'Discord',
                new Set<string>([msg.author.id])
            );
            if (success.length == 0) {
                // put something here if we want to handle user not registered
            } else {
                console.log(
                    `${new Date().toLocaleTimeString()}: ${
                        msg.author.tag
                    } was awarded 1 pt for activity (${msg.createdTimestamp})`
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
