import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { MessageReaction, User } from 'discord.js';

export default class MessageReactionRemoveEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'messageReactionRemove');
    }

    public async emit(client: ACMClient, reaction: MessageReaction, user: User) {}
}
