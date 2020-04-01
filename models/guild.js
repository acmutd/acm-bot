const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
    _id: String,
    channels: {
        confirmation: String,
        error: String,
        bulletin: String
    },
    roles: {
        member: String,
        mute: String
    },
    divisions: Object,
    responses: {
        strike: Array,
        mute: Array,
        kick: Array,
        ban: Array
    }
})

module.exports = new mongoose.model('guild', guildSchema, 'guilds');