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
    var options = ['kick', 'ban', 'mute', 'strike']
    switch(args[1]) {
        case 'kick':
            await responseAddRemove(client, msg, args, 'kick');
            break;
        case 'ban':
            await responseAddRemove(client, msg, args, 'ban');
            break;
        case 'mute':
            await responseAddRemove(client, msg, args, 'mute');
            break;
        case 'strike':
            await responseAddRemove(client, msg, args, 'strike');
            break;
        default: 
            var str = "";
            options.forEach(v => str += "\n.admin responses " + v);
            msg.channel.send('You have to specify what type of response you want to add/remove from. Current types: ```' + str + "```");
    }
}
async function responseAddRemove(client, msg, args, type) {
    var placeholder = '<user>';
    // 1. get current responses
    var responses = client.cache.guilds.get(msg.guild.id).responses[type] ? client.cache.guilds.get(msg.guild.id).responses[type] : [];
    var resp = await wizard.type.optionsResponse(
        msg, client, responses, false, null,
        {
            title: `__**Event Response Settings: Add/Remove ${type.toUpperCase()} Event Responses**__`,
            description: `Enter the number of the response you want to delete, or type in a new response to add.\n __The username placeholder is \'${placeholder}\'__. Ex: \'${placeholder} just got banned!\'`,
        },
    );
    if(resp === false) return;
    if(resp.isOption) {
        var responseChoice = responses[resp.value];
        // 2. remove option index
        var obj = {$pull: {}};
        obj["$pull"][`responses.${type}`] = responseChoice;
        await toolkit.db.update.one(
            client, client.models.guild, {_id: msg.guild.id}, obj, true, true,
            (err) => console.log('issue with responseAddRemove1: ' + err), (doc) => {}
        )
        return msg.channel.send('Successfully removed a response from the \'' + type + '\' event.');
    } else {
        // 3. add option to list
        var newResponse = resp.value;
        var obj = {$addToSet: {}};
        obj["$addToSet"][`responses.${type}`] = newResponse;
        await toolkit.db.update.one(
            client, client.models.guild, {_id: msg.guild.id}, obj, true, true,
            (err) => console.log('issue with responseAddRemove2: ' + err), (doc) => {}
        )
        return msg.channel.send('Successfully added a response to the \'' + type + '\' event.');
    }
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
            description: "Mention the channel you would like to make the new " + channelOptions[channelType.value] + " channel:",
        },
        {
            title: '__**❌ Channel Settings: New Channel**__',
            description: "You must **mention** (#<name of channel>) the channel you would like to make the new " + channelOptions[channelType.value] + " channel:",
        },
    );
    if(newChannel === false) return quit();

    var obj = {};
    obj[`channels.${channelOptions[channelType.value]}`] = newChannel.id;
    toolkit.db.update.one(
        client, client.models.guild, {_id: msg.guild.id}, 
        obj, true, true,
        (err) => {return msg.channel.send("There was an issue updating the channel.")},
        (doc) => {return msg.channel.send(`Successfully reconfigured channel settings for the ${channelOptions[channelType.value]} channel`)}
    )
}

module.exports.info = {
    name: 'admin'
}