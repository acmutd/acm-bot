const { MessageEmbed } = require('discord.js');
const wizard = require('../wizard.js');
const toolkit = require('../toolkit.js');

module.exports.run = async (client, msg, args) => {

    client.indicators.usingCommand.push(msg.author.id);
    function removeID() {
        client.indicators.usingCommand = client.indicators.usingCommand.filter(user => user != msg.author.id)
    }

    switch(args[0]) {
        case 'new': 
            await newEvent(client, msg, args);
            removeID();
            break;
        default:
            await msg.channel.send(`That was an invalid argument. Try again smh <@${msg.author.id}>`)
            removeID();
            return;
    }
}

async function newEvent(client, msg, args) {
    var quit = () => msg.channel.send('Successfully ended the \'new event\' setup wizard!');

    var divisions = {
        acm: {
            img: process.env.ACM_IMG,
            role: null
        },
        projects: {
            img: process.env.PROJECTS_IMG,
            role: process.env.PROJECTS_ROLE
        },
        education: {
            img: process.env.EDUCATION_IMG,
            role: process.env.EDUCATION_ROLE
        },
        hackutd: {
            img: process.env.HACKUTD_IMG,
            role: process.env.HACKUTD_ROLE
        },
    }


    var eventDivision = await wizard.default(
        msg, client, true, 0,
        {
            title: '__**New Event: Division**__',
            description: "What branch of ACM is hosting this event? Enter the right number: \n\`0\`: ACM as a whole\n\`1\`: Projects\n\`2\`: Education\n\`3\`: HackUTD",
        },
        (response) => {
            console.log
            switch(response.content) {
                case '0':
                    return divisions.acm;
                case '1':
                    return divisions.projects;
                case '2':
                    return divisions.education;
                case '3':
                    return divisions.hackutd;    
            }
        },
        {
            title: '__**❌ New Event: Division**__',
            description: "You must enter a number between 0-3. \n\`0\`: ACM as a whole\n\`1\`: Projects\n\`2\`: Education\n\`3\`: HackUTD",
        },
    );
    if(eventDivision === false) return quit();

    var eventName = await wizard.type.text(
        msg, client, false, ' ',
        {
            title: '__**New Event: Name**__',
            description: 'What\'s the **name** of this event?'
        }
    );
    if(eventName === false) return quit();

    var eventDescription = await wizard.type.text(
        msg, client, true, 'No Description',
        {
            title: '__**New Event: Description**__',
            description: 'What\'s the **description** of this event? Write the description somewhere else and copy it here when you\'re done cuz there\'s a timer ticking.'
        }
    );
    if(eventDescription === false) return quit();

    var eventDate = await wizard.type.text(
        msg, client, true, 'N/A',
        {
            title: '__**New Event: Date**__',
            description: 'What\'s the **date** and **time** of this event?\nUse this format for consistency: **\'<WORD_MONTH> <DAY> @ <START_TIME> <AM/PM>\'**'
        }
    );
    if(eventDate === false) return quit();

    var eventGraphic = await wizard.type.graphic(
        msg, client, true, null,
        {
            title: '__**New Event: Graphic**__',
            description: 'Does your event have a graphic, like a flyer? If so, paste the link to that image! Otherwise, you can skip this step with \'skip\'.'
        },
        {
            title: '__**❌ New Event: Graphic**__',
            description: 'Whatever you pasted wasn\'t a link to an acceptable form of media. __Make sure that your link ends with__ **.jpg, .png, .jpeg,** etc. Otherwise, you can skip this step with \'skip\'.'
        }
    );
    if(eventGraphic === false) return quit();
    
    var eventColor;
    try {
        eventColor = await toolkit.misc.colorThief.getColor(eventGraphic)
    } catch (error) {
        eventColor = await wizard.type.color(
            msg, client, true, null,
            {
                title: '__**New Event: Color**__',
                description: 'I was unable to figure out what the primary color of your graphic was. If you want, you can enter the hex code of the color you want on your embed manually, or skip.\n FORMAT: \'#<hexcode>\'.'
            },
            {
                title: '__**❌ New Event: Color**__',
                description: 'Please follow this format: \'#<hexcode>\'. Make sure to include the \'#\'. Or skip by entering \'skip\'.'
            }
        );
        if(eventColor === false) return quit();
        if(eventColor) {
            eventColor = eventColor.substring(1,eventColor.length);
        }
    }
    var data = {eventName, eventDescription, eventDate, eventGraphic, eventColor, eventDivision};
    var embed = await toolkit.embeds.bulletin(client, data);
    var bulletin = msg.guild.channels.resolve(process.env.BULLETIN_CHANNEL);
    bulletin.send({embed: embed});
    if(eventDivision.role) {
        bulletin.send(`<@&${eventDivision.role}>`);
    }
    msg.channel.send('📌 Added a new event to the bulletin channel! :)');
}

module.exports.info = {
    name: 'event'
}