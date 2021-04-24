import { Collection } from "discord.js";
import Command from "../Command";
import ACMClient from "../Bot";
import * as fs from 'fs';

export default class CommandManager {

    public bot: ACMClient;
    public path: string;
    public commands: Collection<string, Command>;

    /**
     * 
     * @param bot ACMClient
     * @param commandPath Path to the command folder
     */
    constructor(bot: ACMClient, commandPath: string) {
        this.bot = bot;
        this.path = commandPath;
        this.commands = new Collection();
    }
    /**
     * Scans filesystem for command files.
     */
    scanCommands() {
        fs.readdir(this.path, (err, files) => {
            this.bot.logger.info(`Found ${files.length} commands(s)!`);
            files.forEach(file => {
                var cmd = require(`${this.path.endsWith('/') ? this.path : this.path+'/'}${file}`);
                var command = new cmd.default();
                this.commands.set(command.name, command);
                this.bot.logger.info(`Loaded the \'${command.name}\' command!`)
            });
        })
    }
}