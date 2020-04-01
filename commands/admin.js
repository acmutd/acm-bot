const toolkit = require('../toolkit.js');
const wizard = require('../wizard.js');

module.exports.run = async (client, msg, args) => {

    if(!msg.member.hasPermission('ADMINISTRATOR')) {
        return msg.channel.send("You must be an admin to access these settings.");
    }

    client.indicators.usingCommand.push(msg.author.id);
    function removeID() {
        client.indicators.usingCommand = client.indicators.usingCommand.filter(user => user != msg.author.id)
    }

    switch(args[0]) {
        case 'responses': 
            await responses(client, msg, args);
            removeID();
            break;
        case 'edit': 
            await edit(client, msg, args);
            removeID();
            break;
        case 'channels': 
            await channels(client, msg, args);
            removeID();
            break;
        case 'strikes':
            await checkStrikes(client, msg, args);
            removeID();
            break;
        case 'mute': 
            await mute(client, msg, args);
            removeID();
            break;
        default: 
            await msg.channel.send(`That was an invalid argument. Try again smh <@${msg.author.id}>`)
            removeID();
            return;
    }
}

async function edit(client, msg, args) {

}

async function responses(client, msg, args) {
}

async function channels(client, msg, args) {

    var quit = () => msg.channel.send('Successfully ended the \'channel reconfiguration\' setup wizard!');

    var channelOptions = ['confirmation', 'error', 'bulletin'];
    var channelType = await wizard.type.options(
        msg, client, channelOptions, false, 1,
        {
            title: '__**Channel Settings: Type**__',
            description: "What channel type would you like to reconfigure?",
        },
        {
            title: '__**❌ Channel Settings: Type**__',
            description: "You must enter a number. What channel type would you like to reconfigure?",
        },
    );
    if(channelType === false) return quit();

    var newChannel = await wizard.type.mention.channel(
        msg, client, false, null,
        {
            title: '__**Channel Settings: New Channel**__',
            description: "Mention the channel you would like to make the new " + channelOptions[channelType] + " channel:",
        },
        {
            title: '__**❌ Channel Settings: New Channel**__',
            description: "You must **mention** (#<name of channel>) the channel you would like to make the new " + channelOptions[channelType] + " channel:",
        },
    );
    if(newChannel === false) return quit();

    var key = 'channels.'
    await toolkit.db.update.one(
        client, client.models.guild, {_id: msg.guild.id}, 
        {key: newChannel.id}, true, true,
        (err) => {return msg.channel.send("There was an issue updating the channel.")},
        (doc) => {return msg.channel.send(`Successfully reconfigured channel settings for the ${channelOptions[channelType]} channel`)}
    )
}

module.exports.info = {
    name: 'admin'
}