import { Message, DMChannel, MessageEmbed, GuildMember, Guild, User } from 'discord.js';
import ACMClient from '../Bot';
import Command from '../Command';
import { settings } from '../../botsettings';
import { FieldValue } from '@google-cloud/firestore';
/**
 * Handles data extraction and data convergence into a simple-to-use system. 
 */
export default class ResolveService {
    public client: ACMClient;

    constructor(client: ACMClient) {
        this.client = client;
    }
    /**
     * Searches a guild for a member based on several resolution strategies. 
     * The available strategies are 'id', 'mention', 'tag', 'username', and 'nickname'. Resolution is always done in that order.
     * 
     * @param {string} toResolve - Value to be resolved into a GuildMember
     * @param {Guild} guild - Discord guild to perform search in
     * @param {Set<string>} [strategies={}] - Set of strategies to use. Default empty set, all will be applied.
     * @param {boolean} [lenient=true] - Lenient search. Default true, disregards whitespace and capitalization.
     * 
     */
    async ResolveGuildMember(toResolve: string, guild: Guild, strategies: Set<string> = new Set<string>(), lenient: boolean = true): Promise<GuildMember | undefined> {
        let member: GuildMember | undefined;
        // Go through each strategy in order if it is an allowed strategy.
        // All strategies are enabled if we don't specify any

        // user ID
        if (!member && (strategies.size == 0 || strategies.has('id')) && /^[\d]{17,18}$/.test(toResolve)) {
            member = guild?.members.cache.find(gm => gm.user.id == toResolve);
        }
        // user mention
        if (!member && (strategies.size == 0 || strategies.has('mention')) && /^<@!?[\d]{17,18}>$/.test(toResolve)) {
            let newToResolve = toResolve.slice(3, -1);
            member = guild?.members.cache.find(gm => gm.user.id == newToResolve);
        }
        // full tag, strict
        if (!member && (strategies.size == 0 || strategies.has('tag')) && /#\d{4}$/.test(toResolve)) {
            member = guild?.members.cache.find(gm => gm.user.tag == toResolve);
        }
        // username, strict
        if (!member && (strategies.size == 0 || strategies.has('username'))) {
            member = guild?.members.cache.find(gm => gm.user.username == toResolve);
        }        
        // nickname, strict
        if (!member && (strategies.size == 0 || strategies.has('nickname'))) {
            member = guild?.members.cache.find(gm => gm.nickname == toResolve);
        }
        // lenient matching: string manipulation potentially expensive!
        if (lenient) {
            toResolve = this.makeLenient(toResolve);
            // full tag, lenient
            if (!member && (strategies.size == 0 || strategies.has('tag')) && /#\d{4}$/.test(toResolve)) {
                member = guild?.members.cache.find(gm => this.makeLenient(gm.user.tag) == toResolve);
            }
            // username, lenient
            if (!member && (strategies.size == 0 || strategies.has('username'))) {
                member = guild?.members.cache.find(gm => this.makeLenient(gm.user.username) == toResolve);
            }
            // nickname, lenient
            if (!member && (strategies.size == 0 || strategies.has('nickname'))) {
                member = guild?.members.cache.find(gm => this.makeLenient(gm.nickname? gm.nickname : '') == toResolve);
            }
        }

        return member;
    }

    /**
     * Process strings for lenient matching by removing spaces and making lowercase
     * @param str 
     */
    private makeLenient(str: string) {
        return str.replace(' ', '').toLowerCase();
    }

}
