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

    enableTracking() {
        this.enabled = true;
    }

    disableTracking() {
        this.enabled = false;
    }
}
