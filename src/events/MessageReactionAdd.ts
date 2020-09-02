import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { MessageReaction } from 'discord.js';
import { User } from '@sentry/node';

export default class MessageReactionAddEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'messageReactionAdd');
    }

    public async emit(client: ACMClient, reaction: MessageReaction, user: User) {
        client.services.rr.handle(reaction, user, 'add');
    }
}
