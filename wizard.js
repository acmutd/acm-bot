const { MessageEmbed, Collection } = require("discord.js");
const toolkit = require("./toolkit.js");

/*
    ! initialEmbed & attemptedEmbed object format
    {
        title: "",
        description: "",
        footer: {
            text: "",
            icon: ""
        }
    }
*/
// * This time limit is linked to all these wizard nodes
const timeLimit = 30000;

function checkEmbed(skippable, initialEmbed, attemptedEmbed) {
    if(initialEmbed) {
        if(!initialEmbed.footer) {
            initialEmbed.footer = {
                text: skippable ? "Type \'skip\' to skip this step, or \'quit\' to quit wizard..." : "Type \'quit\' to quit wizard...",
                icon: null
            }
        }
        if(!initialEmbed.footer.icon) {
            initialEmbed.footer.icon = null;
        }
        if(!attemptedEmbed) {
            var attemptedEmbed = initialEmbed;
        }
        if(!attemptedEmbed.footer) {
            attemptedEmbed.footer = {
                text: skippable ? "Type \'skip\' to skip this step, or \'quit\' to quit wizard..." : "Type \'quit\' to quit wizard...",
                icon: null
            }
        }
    }
    return {
        initial: initialEmbed,
        attempted: attemptedEmbed
    }
}

module.exports.default = async (msg, client, skippable, skipValue, initialEmbed, condition, attemptedEmbed) => {
    var attempted = false;
    var checkedEmbeds = checkEmbed(skippable, initialEmbed, attemptedEmbed);
    initialEmbed = checkedEmbeds.initial;
    attemptedEmbed = checkedEmbeds.attempted;
    do {
        var wizardNode = await msg.channel.send(new MessageEmbed({
            title: attempted ? attemptedEmbed.title : initialEmbed.title, 
            description: attempted ? attemptedEmbed.description : initialEmbed.description, 
            footer: {
                text: attempted ? attemptedEmbed.footer.text : initialEmbed.footer.text,
                icon: attempted ? attemptedEmbed.footer.icon : initialEmbed.footer.icon,
            }
        }));
        try {
            var response = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, {max: 1, time: timeLimit, errors: ['time']})
        } catch(err) {
            msg.channel.send('⏰ You ran out of time (+' + timeLimit/1000 + ' seconds)! Ending wizard...');
            return false;
        }
        // built-in quit detector
        if(response.first().content.toLowerCase() === "quit") {wizardNode.delete(); msg.channel.send("You quit the wizard."); return false;}
        
        if(skippable) {
            if(response.first().content.toLowerCase() === "skip") {wizardNode.delete(); return skipValue;}
        }
        // condition should return what it wants
        var item = await condition(response.first());

        attempted = true;
    } while (!item)
    // deletes the message to reduce clutter
    wizardNode.delete();
    return item;
}

module.exports.type = {
    text: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var res = await this.default(
            msg, 
            client, 
            skippable, 
            skipValue,
            initialEmbed,
            (response) => {
                if(typeof response.content == 'string') {
                    return response.content;
                }
            },
            attemptedEmbed
        )
        return res;
    },
    color: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var res = await this.default(
            msg, 
            client, 
            skippable, 
            skipValue,
            initialEmbed,
            (response) => {
                if(toolkit.misc.colorChecker.isHexColor(response.content)) {
                    return response.content;
                }
            },
            attemptedEmbed
        )
        return res;
    },
    graphic: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var res = await this.default(
            msg, 
            client, 
            skippable, 
            skipValue,
            initialEmbed,
            async (response) => {
                var isMedia = await toolkit.misc.isMediaURL(response.content.toString())
                if(isMedia) {
                    return response.content;
                }
            },
            attemptedEmbed
        )
        return res;
    },
    reaction: async (msg, client, initialEmbed, attemptedEmbed) => {
        // ! 'react with an x to end wizard' is a possibility
        var attempted = false
        do {
            var emojiRequest = await msg.channel.send(new MessageEmbed({
                title: attempted ? attemptedEmbed.title : initialEmbed.title, 
                description: attempted ? attemptedEmbed.description : initialEmbed.description, 
                footer: {
                    text: "You CANNOT quit here. React with SOMETHING at least, just to move on. Still working on making it possible to quit here...",
                    icon: null
                }
            }));
            try{
                var reactedEmote = await emojiRequest.awaitReactions(reaction => reaction.users.first().id === msg.author.id, {maxEmojis: 1, time: timeLimit, errors: ['time']})
            } catch(err) {
                msg.channel.send('⏰ You ran out of time (+' + timeLimit/1000 + ' seconds)! Ending wizard...');
                return false;
            }
            attempted = true
        } while (!reactedEmote.first().emoji.id && !reactedEmote.first().emoji.url)

        emojiRequest.delete();
        return {
            id: reactedEmote.first().emoji.id,
            url: reactedEmote.first().emoji.url,
            name: reactedEmote.first().emoji.name
        };
    },
    yesno: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var res = await this.default(
            msg, 
            client, 
            skippable, 
            skipValue,
            initialEmbed,
            (response) => {
                if(typeof response.content == 'string') {
                    if(response.content.toLowerCase() == 'yes' || response.content.toLowerCase() == 'no') {
                        return response.content;
                    }
                }
            },
            attemptedEmbed
        )
        return res;
    },
    options: async (msg, client, options, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var optionList = "\n";
        var numList = [];
        for(let i = 0; i < options.length; i++) {
            optionList += `\`${i+1}\` | ${options[i]}\n`;
            numList.push(i+1);
        }
        initialEmbed.description ? initialEmbed.description += optionList : initialEmbed.description = optionList;
        if(attemptedEmbed) attemptedEmbed.description ? attemptedEmbed.description += optionList : attemptedEmbed.description = optionList;
        var res = await this.default(
            msg, 
            client, 
            skippable, 
            skipValue,
            initialEmbed,
            (response) => {
                var choice = parseInt(response.content);
                if(numList.includes(choice)) return {value: choice-1};
            },
            attemptedEmbed
        );
        return res;
    },
    optionsResponse: async (msg, client, options, skippable, skipValue, initialEmbed, attemptedEmbed) => {
        var optionList = "\n";
        var numList = [];
        for(let i = 0; i < options.length; i++) {
            optionList += `\`${i+1}\` | ${options[i]}\n`;
            numList.push(i+1);
        }
        initialEmbed.description ? initialEmbed.description += optionList : initialEmbed.description = optionList;
        if(attemptedEmbed) attemptedEmbed.description ? attemptedEmbed.description += optionList : attemptedEmbed.description = optionList;
        var res = await this.default(
            msg,
            client,
            skippable,
            skipValue,
            initialEmbed,
            (response) => {
                var choice = parseInt(response.content);
                if(numList.includes(choice)) return {value: choice-1, isOption: true};
                return {value: response.content, isOption: false};
            },
            attemptedEmbed
        );
        return res;
    },
    mention: {
        channel: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
            var res = await this.default(
                msg, 
                client, 
                skippable, 
                skipValue,
                initialEmbed,
                (response) => {
                    if(response.mentions.channels.array().length > 0) {
                        return response.mentions.channels.first();
                    }
                },
                attemptedEmbed
            )
            return res;
        },
        user: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
            var res = await this.default(
                msg, 
                client, 
                skippable, 
                skipValue,
                initialEmbed,
                (response) => {
                    if(response.mentions.users.array().length > 0) {
                        return response.mentions.users.first();
                    }
                },
                attemptedEmbed
            )
            return res;
        },
        role: async (msg, client, skippable, skipValue, initialEmbed, attemptedEmbed) => {
            var res = await this.default(
                msg, 
                client, 
                skippable, 
                skipValue,
                initialEmbed,
                (response) => {
                    if(response.mentions.roles.array().length > 0) {
                        return response.mentions.roles.first();
                    }
                },
                attemptedEmbed
            )
            return res;
        },
    },
    // special
    confirmation: async (msg, client, initialText, attemptedText, midConfirmationCB) => {
        var attempted = false;
        do {
            var confirmMessage = attempted ? attemptedText : initialText;
            var wizardNode = await msg.channel.send(confirmMessage);
            if(midConfirmationCB) await midConfirmationCB(msg, client, attempted);
            try {
                var confirmation = await msg.channel.awaitMessages(m => m.author.id === msg.author.id, {max: 1, time: timeLimit, errors: ['time']})
            } catch(err) {
                msg.channel.send('⏰ You ran out of time (+' + timeLimit/1000 + ' seconds)! Ending wizard...');
                return false;
            }
            if(confirmation.first().content === "quit") { wizardNode.delete(); return false; }
            attempted = true;
        } while (confirmation.first().content.toLowerCase() != "confirm")

        wizardNode.delete();
        return true;
    }
}