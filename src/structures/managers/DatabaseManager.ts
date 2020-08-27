import ACMClient, { BotConfig } from '../Bot';
import mongoose, { Model } from 'mongoose';
import MemberSchema, { Member } from '../models/Member';
import GuildSchema, { Guild } from '../models/Guild';
import { Collection } from 'discord.js';
import { settings } from '../../botsettings';

export interface SchemaTypes {
    member: Model<Member>;
    guild: Model<Guild>;
}

export default class DatabaseManager {
    public client: ACMClient;
    public url: string;
    public m!: typeof mongoose;
    public schemas: SchemaTypes;

    public guildCache: Collection<string, Guild>;
    /**
     * Constructor of the database manager
     * @param config The BotConfig of the ACMClient (from main.ts).
     */
    constructor(client: ACMClient, config: BotConfig) {
        this.client = client;
        this.guildCache = new Collection();
        this.url = config.dbUrl;
        this.schemas = {
            member: MemberSchema,
            guild: GuildSchema,
        };
    }

    public async connect() {
        this.m = await mongoose.connect(this.url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });

        // replace console.log with a logger
        this.m.connection.on('error', (err) =>
            console.log('There was a connection error in DatabaseManager: ' + err)
        );
    }
    public dispose() {
        this.m.connection.close();

        // add some logs
    }
    public async recacheGuilds() {
        try {
            let docs = await this.schemas.guild.find({});
            docs.forEach((doc) => {
                this.guildCache.set(doc['_id'] as string, doc);
            });
        } catch (err) {
            this.client.logger.error(err);
        }
    }
    public async setup() {
        await this.recacheGuilds();
        if (this.guildCache.size > 0) return;

        try {
            await this.schemas.guild.create({
                _id: settings.guild,
                channels: {
                    verification: settings.channels.verification,
                    error: settings.channels.error,
                    bulletin: settings.channels.bulletin,
                },
                roles: {
                    member: settings.roles.member,
                    mute: settings.roles.mute,
                    director: settings.roles.member,
                },
                divisions: {
                    acm: 'https://www.acmutd.co/png/acm-light.png',
                    projects:
                        'https://harshasrikara.com/acmutd.github.io/global-assets/icon/projects.png',
                    education:
                        'https://harshasrikara.com/acmutd.github.io/global-assets/icon/education.png',
                    hackutd:
                        'https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/challenge_thumbnails/000/479/411/datas/original.png',
                },
                responses: {
                    strike: [],
                    mute: [],
                    kick: [],
                    ban: [],
                },
            });
            await this.recacheGuilds();
        } catch (err) {
            this.client.logger.error(err);
        }
    }

    // * Abstraction
    public async updateGuild(id: string, newData: any, failCB?: Function) {
        try {
            await this.schemas.guild.findByIdAndUpdate(id, newData, {
                new: true,
                upsert: true,
            });
            await this.recacheGuilds();
        } catch (error) {
            this.client.logger.error(error);
            if (failCB) failCB(error);
        }
    }
}
