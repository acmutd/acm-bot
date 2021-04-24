import { Message } from "discord.js";
import Command, { CommandContext } from "../structures/Command";
// Boilerplate Ping command. Tests the bot's response time.
export default class PingCommand extends Command {
    constructor() {
        super({
            name: "ping",
            description: "test",
        });
    }
    /**
     * Standard Command Executor
     * @param param0 Command Arguments
     * @returns Emit Promise
     */
    public async exec({ msg, client, args }: CommandContext) {
        const startTime = new Date().getTime();

        const pingMsg = await msg.channel.send(
            "Ping: This message should be deleted."
        );
        pingMsg.delete();

        return client.response.emit(
            msg.channel,
            `:ping_pong: | It takes me ${
                (new Date().getTime() - startTime) / 1000
            } seconds to send a message.`,
            "success"
        );
    }
}
