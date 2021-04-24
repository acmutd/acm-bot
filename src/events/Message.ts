import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { Message } from 'discord.js';
// Handles messaging through the bot. Handles commands.
export default class MessageEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'message');
    }
    /**
     * Standard Event Executor
     * @param client Bot Instance
     * @param msg Message
     * @returns Promise
     */
    public async emit(client: ACMClient, msg: Message) {
        client.services.verification.handle(msg);
        client.services.command.handle(msg);
        //client.services.activity.handleMessage(msg);
    }
}
