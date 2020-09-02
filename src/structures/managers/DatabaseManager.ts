import ACMClient, { BotConfig } from '../Bot';
import mongoose, { Model } from 'mongoose';
import MemberSchema, { Member } from '../models/Member';
import ResponseSchema, { Response, ResponsesType } from '../models/Response';
import RRMessageSchema, { RRMessage } from '../models/RRMessage';
import { Collection } from 'discord.js';
import { settings } from '../../botsettings';

export interface SchemaTypes {
    member: Model<Member>;
    response: Model<Response>;
    rrmessage: Model<RRMessage>;
}

export interface CacheTypes {
    responses: Collection<string, Response>;
    rrmessages: Collection<string, RRMessage>;
}

export default class DatabaseManager {
    public client: ACMClient;
    public url: string;
    public m!: typeof mongoose;
    public schemas: SchemaTypes;
    public cache: CacheTypes;
    /**
     * Constructor of the database manager
     * @param config The BotConfig of the ACMClient (from main.ts).
     */
    constructor(client: ACMClient, config: BotConfig) {
        this.client = client;
        this.cache = {
            responses: new Collection(),
            rrmessages: new Collection(),
        };
        this.url = config.dbUrl;
        this.schemas = {
            member: MemberSchema,
            response: ResponseSchema,
            rrmessage: RRMessageSchema,
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
        this.client.logger.database('Closed MongoDB connection!');
    }
    public async setup() {
        try {
            await this.recache('response');
            await this.recache('rrmessage');
        } catch (err) {
            this.client.logger.error(err);
        }
    }
    public async recache(schema: keyof SchemaTypes, cache?: keyof CacheTypes) {
        try {
            let docs = await (this.schemas[schema] as Model<any>).find({});
            this.cache[cache ?? (`${schema}s` as keyof CacheTypes)] = new Collection<string, any>();
            docs.forEach((doc) => {
                this.cache[cache ?? (`${schema}s` as keyof CacheTypes)].set(
                    doc['_id'] as string,
                    doc
                );
            });
        } catch (err) {
            this.client.logger.error(err);
        }
    }

    // * Abstraction
    public async responseAdd(type: ResponsesType, message: string): Promise<boolean> {
        try {
            await this.schemas.response.create({ type, message });
            await this.recache('response');
            return true;
        } catch (err) {
            return false;
        }
    }
    public async responseDelete(message: string): Promise<boolean> {
        try {
            await this.schemas.response.findOneAndDelete({ message });
            await this.recache('response');
            return true;
        } catch (err) {
            return false;
        }
    }

    public async rrmsgAdd(newData: any) {
        await this.schemas.rrmessage.create(newData);
        await this.recache('rrmessage');
        await this.recache('response');
    }
    public async rrmsgDelete(id: string) {}

    public async strikeAdd(amount: number, id: string) {}
}
