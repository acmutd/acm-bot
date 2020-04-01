const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    _id: String,
    strikes: Number,
    lastStrike: Date,
})

module.exports = new mongoose.model('member', memberSchema, 'members');