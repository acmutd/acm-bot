import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { MessageReaction, User } from 'discord.js';
// Handles addition of reactions by users (heavily relied upon by the circles service)
export default class MessageReactionAddEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'messageReactionAdd');
    }
    /**
     * Standard Event Executor
     * @param client Bot Instance
     * @param reaction Message Reaction
     * @param user User Instance
     * @returns Promise
     */
    public async emit(client: ACMClient, reaction: MessageReaction, user: User) {
        client.services.rr.handle(reaction, user);
        client.services.points.handleReactionAdd(reaction, user);
        client.services.circles.handleReactionAdd(reaction, user);
    }
}
