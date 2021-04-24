import ACMClient from '../Bot';
import { MessageReaction, TextChannel, User } from 'discord.js';
import { identitytoolkit } from 'googleapis/build/src/apis/identitytoolkit';
import e from 'express';
import { RRMessageData } from '../models/RRMessage';
/**
 * Handles reaction roles and their functionality (create, handle, fetch, etc)
 */
export default class RRService {
    public client: ACMClient;
    public emojiRegEx: RegExp;

    constructor(client: ACMClient) {
        this.client = client;
        this.emojiRegEx = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    }

    async create(rrData: RRMessageData) {
        // get guild, channel, and message
        try {
            var guild = await this.client.guilds.fetch(rrData.guild);
            var channel = await this.client.channels.fetch(rrData.channel);
            if (channel instanceof TextChannel) {
                var message = await (channel as TextChannel).messages.fetch(rrData._id);
            } else {
                throw "The channel referenced wasn't a text channel. This technically shouldn't ever happen if you provided a proper message link";
            }
        } catch (e) {
            throw e ?? 'There was an issue add a reaction role to the DB';
        }

        // react
        Object.keys(rrData).forEach((key) => {
            if (key.match(this.emojiRegEx)) message.react(key);
            else message.react(guild!.emojis.resolve(key)!);
        });

        // add to db
        try {
            await this.client.database.rrmsgAdd(rrData);
        } catch (err) {
            throw 'There was an issue add a reaction role to the DB';
        }
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
