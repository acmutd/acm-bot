import { Message } from 'discord.js';
import ACMClient from '../Bot';
import { settings } from '../../botsettings';

export default class VerificationService {
    public channelID: string;
    public client: ACMClient;

    constructor(client: ACMClient, channelID: string) {
        this.channelID = channelID;
        this.client = client;
    }

    public handle(msg: Message) {
        if (msg.guild) {
            if (msg.channel.id == this.channelID && msg.member) {
                try {
                    msg.member.setNickname(msg.content);
                    msg.member.roles.add(settings.roles.member);
                    msg.delete();
                    // add to firebase
                    let map: any = {};
                    map[msg.member.id] = msg.content;
                    this.client.firestore.firestore?.collection('discord').doc('snowflake_to_name').set(map, {merge: true})
                    return;
                } catch (err) {
                    this.client.logger.error(err);
                }
            }
        }
    }
}
