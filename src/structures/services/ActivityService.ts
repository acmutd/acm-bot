import { Collection, Message, VoiceChannel, VoiceState } from 'discord.js';
import ACMClient from '../Bot';
import { settings } from '../../botsettings';

export default class ActivityService {
    public client: ACMClient;
    public enabled: boolean;
    public activityLog: Map<string, number>;
    public voiceLog: Collection<string, Set<string>>;

    constructor(client: ACMClient) {
        this.client = client;
        this.enabled = false;
        this.activityLog = new Map<string, number>();
        this.voiceLog = new Collection<string, Set<string>>(); // voice channel ID → set of user IDs
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
            let { success, failure } = await this.client.services.hacktoberfest.awardPoints(
                1,
                'DiscordActivity',
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

    async startRecordVoiceChannel(voiceChannel: VoiceChannel) {
        let attendees = new Set<string>();

        if (voiceChannel.guild.id != settings.guild) return; // only works if we are in the right guild
        if (!this.enabled) return; // doesn't work if the event hasn't started
        if (this.client.indicators.hasKey('voiceActivity', voiceChannel.id)) // event already running in this channel

        // add non-bot users to the attendance set
        for (const [snowflake, member] of voiceChannel.members) {
            if (member.user.bot) continue;
            attendees.add(member.id);
        }

        this.client.indicators.setKeyValue('voiceActivity', voiceChannel.id, attendees);
    }

    async endRecordVoiceChannel(voiceChannel: VoiceChannel) {
        let originalAttendees: Set<string> = this.client.indicators.getValue('voiceActivity', voiceChannel.id) as Set<string>;
        let trueAttendees = new Set<string>();

        if (voiceChannel.guild.id != settings.guild) return; // only works if we are in the right guild
        if (!this.enabled) return; // doesn't work if the event hasn't started
        if (!originalAttendees) return; // no event running in this channel

        for (const [snowflake, member] of voiceChannel.members) {
            if (member.user.bot) continue;
            if (originalAttendees.has(snowflake)) {
                trueAttendees.add(snowflake);
            }
        }
        this.client.indicators.removeKey('voiceActivity', voiceChannel.id);

        return trueAttendees;
    }

    enableTracking() {
        this.enabled = true;
    }

    disableTracking() {
        this.enabled = false;
    }
}
