import ACMClient from '../Bot';
import { MessageEmbed, TextChannel } from 'discord.js';
import { settings } from '../../botsettings';

export default class CaretakerService {
    public client: ACMClient;
    private lastMsg: string | Date;

    constructor(client: ACMClient) {
        this.client = client;
        const now = new Date();
        this.lastMsg = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            now.getHours(),
            now.getMinutes() + 1
        );
        this.schedule();
    }

    // schedule the caretaker task
    public async schedule() {
        await this.client.scheduler.createTask({
            id: 'caretaker',
            type: 'caretaker',
            //cron: this.lastMsg,
            cron: '15 8 1 * * *',
        });
    }

    //
    // Caretaker msg handling //
    //
    public async send(responseId?: string) {
        // send them in general if you find the general channel (regex)
        const guild = await this.client.guilds.fetch(settings.guild);
        const generals = guild.channels.cache.filter(
            (channel) => channel.name == 'general' && channel.type == 'text'
        );

        // find caretaker messages
        const caretakerMsgs = this.client.database.cache.responses.filter(
            (res) => res.type == 'caretaker'
        );

        if (caretakerMsgs.size != 0 && generals.size != 0) {
            const msg =
                responseId != undefined
                    ? caretakerMsgs.find((r) => r.id == responseId)
                    : caretakerMsgs.first();
            const general = generals.first();

            // craft and send the message
            (general as TextChannel).send(msg?.message);

            // remove the caretaker message from db to prevent same message twice
            await this.client.database.responseDelete(msg?.message as string);
        }

        // reschedule a new caretaker
        if (typeof this.lastMsg != 'string') {
            this.lastMsg = new Date(
                this.lastMsg.getFullYear(),
                this.lastMsg.getMonth(),
                this.lastMsg.getDate(),
                this.lastMsg.getHours() + 12,
                this.lastMsg.getMinutes()
            );
        }
        await this.schedule();
    }

    formatAMPM(date: Date) {
        var hours = date.getHours();
        var minutes: any = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }
}
