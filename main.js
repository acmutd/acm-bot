const { Client, Collection, MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const toolkit = require('./toolkit.js');
const schedule = require('node-schedule');
const fs = require('fs');
require('dotenv').config();

const client = new Client();
client.commands = new Collection();
mongoose.set('useFindAndModify', false);

const rule = new schedule.RecurrenceRule();
rule.hour = 20;
rule.minute = 00;

schedule.scheduleJob(rule, async () => {
    var twoWeeks = new Date('December 15, 2019') - new Date('December 1, 2019');
    var minute = 60000;  // for testing
    // * find out whose strikes have expired
    var members = [];  // list of members whos strikes have expired
    await client.models.member.find({}, async (err, docs) => {
        if(err) return console.log(err);
        if(docs) {
            for(let i = 0; i < docs.length; i++) {
                var lastStrike = docs[i].lastStrike;
                var strikes = docs[i].strikes;
                if(((new Date() - lastStrike) > twoWeeks) && (strikes > 0)) members.push(docs[i]["_id"]);
            }
        }
    });
    var inc = 1/2;
    await toolkit.db.update.many(
        client, client.models.member, { _id: { $in: members } }, { $inc : {'strikes' : -inc} },
        false, false, (err) => console.log(err), (doc) => {}
    );
});

client.indicators = {
    usingCommand: []
}

// cache
client.cache = {
    guilds: new Collection(),
    members: new Collection()
}

// mongoose models
client.models = {
    member: require('./models/member.js'),
    guild: require('./models/guild.js')
}

mongoose.connect('mongodb://localhost:27017/acmbot', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log("\nSUCCESSFULLY CONNECTED TO MONGO DB"))
    .catch(err => {
        if(err) {
            console.log("\nCONNECTION TO MONGO DB FAILED: \n" + err)
        }
    });

// initially cache guild data
client.models.guild.find({}, async (err, docs) => {
    if(err) {
        console.log("Could not initially (before client ready) cache guild data.");
        return;
    }
    if(docs) {
        await docs.forEach(doc => {
            client.cache.guilds.set(doc["_id"], doc);
        })
        console.log("Initially cached the \'guilds\' collection!")
    }
});

// make sure that all errors are sent as embeds to the error channels
process.on('unhandledRejection', (err) => handleUncaughtErrorsOverride(err));
process.on('uncaughtException', (err) => handleUncaughtErrorsOverride(err));

function handleUncaughtErrorsOverride(err) {
    if(client.cache.guilds.first()) {
        var guildForErrors = client.cache.guilds.first();
        if(guildForErrors.channels.error) {
            var guild = client.guilds.resolve(guildForErrors["_id"]);
            var embed = new MessageEmbed();
            embed.setTitle(`🤖 **${client.user.username}** BOT ERROR ${err.name ? "| "+err.name : ""}`);
            embed.addField("**Error Message**", err.message ? err.message : err);
            embed.setThumbnail(client.user.displayAvatarURL());
            embed.setColor('RED');
            guild.channels.resolve(guildForErrors.channels.error).send({embed});
        }
    }
    console.log(err);
}

Array.prototype.diff = function(a) {
    return [...this.filter(function(i) {return a.indexOf(i) < 0;})];
}; 

client.on('ready', async () => {
    console.log('=================== READY START ===================');
    console.log(`Logged in as ${client.user.username}!`);
    var invite = await client.generateInvite(["ADMINISTRATOR"]);
    console.log(invite);
    await client.user.setActivity(process.env.ACTIVITY_DESCRIPTION, {type: process.env.ACTIVITY_TYPE})
    console.log(`Set activity to \"${process.env.ACTIVITY_TYPE} ${process.env.ACTIVITY_DESCRIPTION}\"`)
    console.log('==================== READY END ====================');
    // init testing
    await initializeNewGuilds(client);
})

// * load commands and events
fs.readdir('./commands', (err, files) => {
    console.log(`Found ${files.length} command(s)!`);
    files.forEach(file => {
        var command = require(`./commands/${file}`);
        client.commands.set(command.info.name, command);
        console.log(`Loaded the \'${command.info.name}\' command!`)
    })    
})
fs.readdir('./events', (err, files) => {
    console.log(`Found ${files.length} event(s)!`);
    files.forEach(file => {
        var event = require(`./events/${file}`);
        client.on(event.info.name, event.run.bind(null, client));
        console.log(`Setup response for the \'${event.info.name}\' event!`)
    }) 
})

client.login(process.env.TOKEN);

async function initializeNewGuilds(client) {
    var guilds = client.guilds.cache.keyArray();
    var registeredGuilds = client.cache.guilds.keyArray();
    var newGuilds = guilds.diff(registeredGuilds);
    for(let i = 0; i < newGuilds.length; i++) {
        await toolkit.db.add(
            client, client.models.guild,
            {
                _id: newGuilds[i], 
                channels: {
                    confirmation: "692430824712437840",
                    error: "692975827964526592",
                    bulletin: "692270452265058325"
                },
                roles: {
                    member: "692285637843353630",
                },
                divisions: {
                    acm: "https://www.acmutd.co/png/acm-light.png",
                    projects: "https://harshasrikara.com/acmutd.github.io/global-assets/icon/projects.png",
                    education: "https://harshasrikara.com/acmutd.github.io/global-assets/icon/education.png",
                    hackutd: "https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/challenge_thumbnails/000/479/411/datas/original.png"
                },
                responses: {
                    strike: [],
                    mute: [],
                    kick: [],
                    ban: []
                }
            }
        );
    }
}
