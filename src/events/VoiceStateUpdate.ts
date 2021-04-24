import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { GuildMember, Message, MessageEmbed, VoiceState } from 'discord.js';
// Handles join and leave events from all voice channels (heavily relied upon the VCEvent suite).
export default class VoiceStateUpdateEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'voiceStateUpdate');
    }
    /**
     * Standard Event Executor
     * @param client Bot Instance
     * @param oldMember Old State
     * @param newMember New State
     * @returns Promise
     */
    public async emit(client: ACMClient, oldMember: VoiceState, newMember: VoiceState) {
        client.activity.handleVoiceStateUpdate(oldMember, newMember);
    }
}
