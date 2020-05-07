import { TextChannel, Message } from "discord.js";
import ACMClient from "../Bot";



export default class VerificationService {
    public channelID: string;
    public client: ACMClient;
    
    constructor(client: ACMClient, channelID: string) {
        this.channelID = channelID;
        this.client = client;
    }

    public handle(msg: Message) {
        if(msg.guild) {
            if(msg.channel.id == this.channelID && msg.member) {
                try {
                    msg.member.setNickname(msg.content);
                    msg.member.roles.add(process.env.MEMBER_ROLE!);
                    msg.delete();
                    return;
                } catch(err) {
                    this.client.logger.error(err);
                }
            }
        }
    }
}