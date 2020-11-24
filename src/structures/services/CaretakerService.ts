import ACMClient from '../Bot';
import { MessageEmbed, TextChannel } from 'discord.js';
import { settings } from '../../botsettings';

export default class CaretakerService {
    public client: ACMClient;
    private lastMsg: string | Date;

    constructor(client: ACMClient) {
        this.client = client;
        this.lastMsg = '0 19 * * *';
    }

    // schedule the caretaker task
    public async schedule() {
        await this.client.scheduler.createTask({
            id: 'caretaker',
            type: 'caretaker',
            cron: this.lastMsg,
        });
    }

    //
    // Caretaker msg handling //
    //
    public async send() {
        // find caretaker messages
        const caretakerMsgs = this.client.database.cache.responses.filter(
            (res) => res.type == 'caretaker'
        );
        if (caretakerMsgs.size == 0) return;
        const msg = caretakerMsgs.first();

        // send them in general if you find the general channel (regex)
        const guild = await this.client.guilds.fetch(settings.guild);
        const generals = guild.channels.cache.filter(
            (channel) => channel.name.includes('general') && channel.type == 'text'
        );
        if (generals.size == 0) return;
        const general = generals.first();

        // craft the message
        (general as TextChannel).send(msg?.message);

        // remove the caretaker message from db to prevent same message twice
        await this.client.database.responseDelete(msg?.message as string);

        // reschedule a new caretaker
        this.schedule();
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
