import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { MessageReaction, User } from 'discord.js';
// Handles removal of reactions by users (heavily relied upon by the circles service)

export default class MessageReactionRemoveEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'messageReactionRemove');
    }

    public async emit(client: ACMClient, reaction: MessageReaction, user: User) {}
}
