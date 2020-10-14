import { Message, DMChannel, MessageEmbed } from 'discord.js';
import ACMClient from '../Bot';
import Command from '../Command';
import { settings } from '../../botsettings';
import e from 'express';

export default class ActivityService {
    public client: ACMClient;
    public enabled: boolean;
    public activityLog: Map<string, number>;

    constructor(client: ACMClient) {
        this.client = client;
        this.enabled = false;
        this.activityLog = new Map<string, number>();
    }

    async handle(msg: Message) {
        if (msg.author.bot) return;                             // don't process bots
        if (msg.content.startsWith(settings.prefix)) return;    // don't count commands
        if (msg.guild?.id != settings.guild) return;            // don't count anything outside of guild, including DMs

        // add points if cooldown has expired or if first message
        if ( 
            (this.activityLog.has(msg.author.id) && Number(msg.id) >> 22 > this.activityLog.get(msg.author.id)! + 10*1000) ||
            (!this.activityLog.has(msg.author.id))
        ) {
            let {success, failure} = await this.client.services.hacktoberfest.awardPoints(1, 'DiscordActivity', new Set<string>(msg.author.id));
            if (success.length == 0) {
                ; // put something here if we want to handle user not registered
            }
            else {
                console.log(`${new Date().toLocaleTimeString()}: ${msg.author.tag} was awarded 1 pt for activity (${Number(msg.id) >> 22})`);
            }
            this.activityLog.set(msg.author.id, Number(msg.id) >> 22);
        }

    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

}


