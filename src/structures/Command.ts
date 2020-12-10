import ACMClient from './Bot';
import { Message, MessageEmbed } from 'discord.js';

export enum CommandType {
    PARAMS,
    WIZARD,
    BOTH,
}

export interface CommandContext {
    client: ACMClient;
    msg: Message;
    args: string[];
}

export interface CommandConfig {
    name: string;
    description: string;
    longDescription?: string;
    type?: CommandType;
    usage?: string[];
    tags?: string[];
    cooldown?: number;
    dmWorks?: boolean;
    userPermissions?: number;
    requiredRole?: string;
}

export default abstract class Command {
    public name: string;
    public description: string;
    public longDescription: string;
    public type: CommandType;
    public usage: string[];
    public tags: string[];
    public cooldown: number;
    public dmWorks: boolean;
    public userPermissions: number;
    public requiredRole: string | undefined;

    constructor(config: CommandConfig) {
        this.name = config.name;
        this.description = config.description;
        this.longDescription = config.longDescription || config.description;
        this.type = config.type || CommandType.WIZARD;
        this.usage = config.usage || [];
        this.tags = config.tags || [];
        this.cooldown = config.cooldown || 0;
        this.dmWorks = config.dmWorks || false;
        this.userPermissions = config.userPermissions || 0;
        this.requiredRole = config.requiredRole;
    }

    // TODO: Find a use for the return of the exec function
    public abstract async exec(context: CommandContext): Promise<any>;

    infoEmbed() {
        var embed = new MessageEmbed()
            .setTitle(`Command ${this.name}`)
            .setDescription(`**${this.description}**`)
            .addField(
                'Usage',
                this.usage.length > 0 ? this.usage.join(', ') : 'No usage cases available',
                true
            )
            .addField('Tags', this.tags.length > 1 ? this.tags.join(', ') : 'No tags', true)
            .addField('Works in DMs?', this.dmWorks ? 'Yes' : 'No', true)
            .addField('Cooldown', `${this.cooldown} seconds`, true);

        return embed;
    }

    getUsageText(prefix: string) {
        return this.usage.length > 0
            ? this.usage.map((e) => `${prefix}${e}`).join(', ')
            : 'No usage cases available.';
    }
}
