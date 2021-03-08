import Event from '../structures/Event';
import ACMClient from '../structures/Bot';
import { Message } from 'discord.js';

export default class MessageEvent extends Event {
    constructor(client: ACMClient) {
        super(client, 'message');
    }

    public async emit(client: ACMClient, msg: Message) {
        client.services.verification.handle(msg);
        client.services.command.handle(msg);
        //client.services.activity.handleMessage(msg);
    }
}
