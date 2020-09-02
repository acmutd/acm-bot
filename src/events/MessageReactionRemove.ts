import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { MessageReaction } from 'discord.js';
import { User } from '@sentry/node';

export default class MessageReactionRemoveEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'messageReactionRemove');
    }

    public async emit(client: ACMClient, reaction: MessageReaction, user: User) {
        client.services.rr.handle(reaction, user, 'remove');
    }
}
