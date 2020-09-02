import ACMClient from '../Bot';
import { MessageReaction, TextChannel } from 'discord.js';
import { User } from '@sentry/node';
import Guild from '../models/Guild';

export default class RRService {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }

    async handle(reaction: MessageReaction, user: User, type: 'add' | 'remove') {
        if (!reaction.message.guild) return;
        const rrmsg = this.client.database.cache.rrmessages.get(reaction.message.id);
        if (!rrmsg) return;
        const keys = Object.keys(rrmsg.reactionRoles);
        try {
            await this.normalReaction(this.client, reaction, user, rrmsg, type == 'add');
            return;
        } catch (err) {
            this.client.logger.error(
                'There was an error trying to give a member a role based on what emote they reacted in messageReactionAdd'
            );
            this.client.logger.error(err);
            reaction.users.remove(user.id);
            return;
        }
    }

    public async fetchMsgs() {
        let channelIDs = this.client.database.cache.rrmessages.map((rr) => rr.channel);
        channelIDs = channelIDs.filter((a, b) => channelIDs.indexOf(a) === b);
        console.log(channelIDs);
        for (let i = 0; i < channelIDs.length; i++) {
            let id = channelIDs[i];
            const guildID = this.client.database.cache.rrmessages.find((rr) => rr.channel == id)!
                .guild;
            const guild = await this.client.guilds.fetch(guildID);
            console.log(this.client.guilds);
            const channel = guild.channels.resolve(id);
            if (channel) await channel.fetch();
            else return this.client.logger.error('Could not fetch RR channels :(');
            console.log('Fetched RR channels!');
        }
    }

    private async normalReaction(
        client: ACMClient,
        reaction: MessageReaction,
        user: User,
        rrmsg: any,
        add: boolean
    ) {
        const guild = client.guilds.resolve(reaction.message.guild!);
        if (!guild) return;
        const member = guild.members.resolve(user.id!);
        if (!member) return;
        add
            ? member.roles.add(
                  rrmsg.reactionRoles[reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name]
              )
            : member.roles.remove(
                  rrmsg.reactionRoles[reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name]
              );
    }
}
