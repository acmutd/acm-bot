import { Message } from "discord.js";
import Command, { CommandContext } from "../structures/Command";

export default class PingCommand extends Command {
    constructor() {
        super({
            name: "ping",
            description: "test",
        });
    }

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
