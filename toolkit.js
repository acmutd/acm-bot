const isURL = require("is-url");
const request = require('request-promise').defaults({ encoding: null });
const colorThief = require('colorthief');
const colorChecker = require("css-color-checker");
const { MessageEmbed } = require('discord.js');

module.exports.ai = {
    detectSafeSearch: async (fileLink) => {
        const vision = require('@google-cloud/vision');
        const imageAnnotator = new vision.ImageAnnotatorClient({ keyFilename: process.env.KEY_FILENAME });
        try {
            var response = await request.get(fileLink);
            const [result] = await imageAnnotator.safeSearchDetection(response);
            const detections = result.safeSearchAnnotation;
            return detections;
        } catch (error) {
            console.log('There was an issue trying to detect obscenity in a picture. Error: ' + error);
        }
    }
}

module.exports.embeds = {
    bulletin: async (client, data) => {
        var embed = new MessageEmbed();
        embed.setTitle(data.eventName);
        embed.addField('Description', data.eventDescription);
        embed.addField('Date', data.eventDate);
        embed.setImage(data.eventGraphic);
        embed.setColor(data.eventColor);
        embed.setThumbnail(data.eventDivision.img);
        return embed;
    },
    // error is the only tool that doesn't return an embed. 
    // it is automatically sent to the error channel
    error: async (client, err) => {
        if(process.env.ERROR_CHANNEL) {
            var embed = new MessageEmbed();
            embed.setTitle(err.name.substring(0,200));
            embed.addField("Error Description", err.message.substring(0,200));
            embed.setColor('RED');
            client.guilds.get(process.env.GUILD).channels.get(process.env.ERROR_CHANNEL).send(embed);
        }
    }
}

// all functions should include the option to recache data
module.exports.db = {
    add: async (client, schema, newData, recache, failure, success) => {
        await schema.create(newData, async (err, docs) => {
            if(err) {
                if(failure) {
                    await failure(err);
                }
                return;
            }
            if(docs) {
                if(success) {
                    await success(docs);
                }
                // recache the collection
                if(recache) await this.db.recache(client, schema, "\'add\'");
            }
        })
    },
    delete: {
        one: async (client, schema, filterData, recache, failure, success) => {
            try {
                var doc = await schema.deleteOne(filterData);
            } catch (err) {
                if(failure) {
                    failure(err)
                }
            }
            if(doc) {
                if(success) {
                    success(doc);
                }
                // console.log("BEFORE RECACHE")
                // console.log(cache.array().length);
                if(recache) await this.db.recache(client, schema, "\'delete one\'")
                // console.log("AFTER RECACHE")
                // console.log(cache.array().length);
            }
        },
        many: async (client, schema, filterData, recache, failure, success) => {
            await schema.deleteMany(filterData, async (err, docs) => {
                if(err) {
                    if(failure) {
                        await failure(err);
                    }
                    return;
                }
                if(docs) {
                    if(success) {
                        await success(docs);
                    }
                    
                    // recache the data
                    if(recache) await this.db.recache(client, schema, "\'delete many\'");
                }
            })
        },
    },
    update: {
        // update.one returns new doc, whereas update.many does not
        one: async (client, schema, filterData, updateData, upsert, recache, failure, success) => {
            await schema.findOneAndUpdate(filterData, updateData, {new: true, upsert}, async (err, doc) => {
                if(err) {
                    if(failure) {
                        await failure(err);
                    }
                    return;
                }
                if(doc) {
                    if(success) {
                        await success(doc)
                    }
                    // recache the collection
                    if(recache) await this.db.recache(client, schema, "\'update one\'");
                }
            })
        },
        many: async (client, schema, filterData, updateData, upsert, recache, failure, success) => {
            await schema.updateMany(filterData, updateData, {upsert}, async (err, docs) => {
                if(err) {
                    if(failure) {
                        await failure(err);
                    }
                    return;
                }
                if(docs) {
                    if(success) {
                        await success(docs)
                    }
                    // recache the collection
                    if(recache) await this.db.recache(client, schema, "\'update many\'");
                }
            })
        }
    },

    // RECACHES USING ID AS KEY FOR COLLECTION ENTRIES
    // CONSIDER PASSING DATA FROM WITHIN EACH db METHOD. LIKE (schema, cache, >type<) and pass stuff like "add", "delete" from the functions above!
    recache: async (client, schema, crudType) => {
        try {
            var docs = await schema.find({});
        } catch (err) {
            console.log(`There was an issue trying to recache after the ${crudType} operation!`);
        }
        if(docs) {
            // console.log(client.cache[schema.collection.name].array().length);
            client.cache[schema.collection.name] = new Collection();
            await docs.forEach(doc => {
                client.cache[schema.collection.name].set(doc["_id"], doc);
            })
            // console.log(client.cache[schema.collection.name].array().length);
        }
    }
}

module.exports.misc = {
    isMediaURL: async (string) => {
        if(await !isURL(string)) return false;
        if(!string.endsWith(".gif") && 
            !string.endsWith(".jpg") && 
            !string.endsWith(".png") && 
            !string.endsWith(".jpeg") && 
            !string.endsWith(".gif/") && 
            !string.endsWith(".jpg/") && 
            !string.endsWith(".png/") && 
            !string.endsWith(".jpeg/")
        ) {
            return false;
        }
        return true;
    },
    colorThief,
    colorChecker,
}