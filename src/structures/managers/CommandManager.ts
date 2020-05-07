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

    scanCommands() {
        fs.readdir(this.path, (err, files) => {
            console.log(`Found ${files.length} command(s)!`);
            files.forEach(file => {
                var cmd = require(`${this.path.endsWith('/') ? this.path : this.path+'/'}${file}`);
                var command = new cmd.default();
                this.commands.set(command.name, command);
                console.log(`Loaded the \'${command.name}\' command!`)
            });
        })
    }
}