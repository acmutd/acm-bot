const toolkit = require('../toolkit.js');

module.exports.run = (client, msg) => {
    if(msg.author.bot) return;

    // * if message is to the confirmation channel
    if(msg.channel.id == process.env.CONFIRMATION_CHANNEL) {
        try {
            msg.member.setNickname(msg.content);
            msg.member.roles.add(process.env.MEMBER_ROLE);
            msg.delete();
            return;
        } catch(err) {
            return toolkit.embeds.error(client, err);
        }
    }

    // * essentials
    if(!msg.content.startsWith(process.env.PREFIX)) return;

    var command = msg.content.substring(process.env.PREFIX.length).split(" ")[0];
    var args = msg.content.substring(process.env.PREFIX.length).split(" ").slice(1);

    let cmd = client.commands.get(command);
    if(!cmd) return;

    // * before running the command, is the user already using a setup wizard?
    if(client.indicators.usingCommand.includes(msg.author.id)) {
        msg.channel.send("You are already using a command (setup wizard, etc.). Finish that command before starting another one. B-BAKA!!!");
        return;
    }

    cmd.run(client, msg, args);
}

module.exports.info = {
    name: 'message'
}