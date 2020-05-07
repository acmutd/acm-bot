import { BotConfig } from "../Bot";
import mongoose from 'mongoose';

export default class DatabaseManager {
    public url: string;
    public m!: typeof mongoose;
    
    /**
     * Constructor of the database manager
     * @param config The BotConfig of the ACMClient (from main.ts).
     */
    constructor(config: BotConfig) {
        this.url = config.dbUrl;
    }

    public async connect() {
        this.m = await mongoose.connect(this.url, {
            useNewUrlParser: true, 
            useUnifiedTopology: true
        })

        // replace console.log with a logger
        this.m.connection.on('error', err => console.log("There was a connection error in DatabaseManager: " + err));
    }

    public dispose() {
        this.m.connection.close();

        // add some logs
    }
}