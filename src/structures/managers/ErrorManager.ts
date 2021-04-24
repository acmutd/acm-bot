import ACMClient, { BotConfig } from '../Bot';
import { settings, Settings } from '../../botsettings';
import { MessageEmbed, TextChannel } from 'discord.js';

export default class ErrorManager {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }
    /**
     * Boilerplate async callback setup.
     */
    setup() {
        process.on('unhandledRejection', (err) => this.handleMsg(err));
        process.on('uncaughtException', (err) => this.handleErr(err));
    }
    /**
     * Handles bot messages.
     * @param message Raw Message
     * @returns Nothing
     */
    handleMsg(message: string | {} | null | undefined): void {
        if (!message) return;
        message = message.toString();
        var guild = this.client.guilds.resolve(settings.guild);
        if (guild) {
            var embed = new MessageEmbed();
            embed.setTitle(`🤖 **${this.client.user!.username}** Bot Error`);
            embed.addField('**Error Message**', message);
            embed.setColor('RED');
            let errorChannel = guild.channels.resolve(settings.channels.error);
            if (errorChannel && errorChannel.type == 'text')
                (errorChannel as TextChannel).send(embed);
        }
        this.client.logger.error(message);
    }
    /**
     * Handles bot errors.
     * @param err Raw Error
     * @returns Nothing
     */
    handleErr(err: Error | null | undefined): void {
        if (!err) return;
        var guild = this.client.guilds.resolve(settings.guild);
        if (guild) {
            var embed = new MessageEmbed();
            embed.setTitle(
                `🤖 **${this.client.user!.username}** Bot Error ${
                    err.name ? '| ' + err.name : ''
                }`
            );
            embed.addField(
                '**Error Message**',
                err.message ? err.message : err
            );
            embed.setColor('RED');
            let errorChannel = guild.channels.resolve(settings.channels.error);
            if (errorChannel && errorChannel.type == 'text')
                (errorChannel as TextChannel).send(embed);
        }
        this.client.logger.error(err.message);
    }
}
