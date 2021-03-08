import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { GuildMember, Message, MessageEmbed, VoiceState } from 'discord.js';

export default class VoiceStateUpdateEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'voiceStateUpdate');
    }

    public async emit(client: ACMClient, oldMember: VoiceState, newMember: VoiceState) {
        client.activity.handleVoiceStateUpdate(oldMember, newMember);
    }
}
