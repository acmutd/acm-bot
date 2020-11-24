import ACMClient from '../Bot';
import { MessageReaction, TextChannel, User } from 'discord.js';
import { identitytoolkit } from 'googleapis/build/src/apis/identitytoolkit';
import e from 'express';

export default class RRService {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }

    async handle(reaction: MessageReaction, user: User) {
        if (!reaction.message.guild) return;
        const rrmsg = this.client.database.cache.rrmessages.get(reaction.message.id);
        if (!rrmsg) return;
        const keys = Object.keys(rrmsg.reactionRoles);
        try {
            await this.normalReaction(this.client, reaction, user, rrmsg);
            reaction.users.remove(user.id);
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
        for (let i = 0; i < channelIDs.length; i++) {
            let id = channelIDs[i];
            let channel;
            try {
                channel = await this.client.channels.fetch(id);
            } catch (e) {
                console.error(e);
            }
            if (!channel) return this.client.logger.error('Could not fetch RR channels :(');
        }
    }

    private async normalReaction(
        client: ACMClient,
        reaction: MessageReaction,
        user: User,
        rrmsg: any
    ) {
        const guild = client.guilds.resolve(reaction.message.guild!);
        if (!guild) return;
        const member = guild.members.resolve(user.id!);
        if (!member) return;
        const hasRole = member.roles.cache.has(
            rrmsg.reactionRoles[reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name]
        );
        if (!hasRole)
            member.roles.add(
                rrmsg.reactionRoles[reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name]
            );
        else
            member.roles.remove(
                rrmsg.reactionRoles[reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name]
            );
    }
}
