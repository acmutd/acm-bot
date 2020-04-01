const toolkit = require('../toolkit.js');

module.exports.run = async (client, msg, args) => {
    const avatarURL = msg.author.displayAvatarURL({format: 'png'});
    const results = await toolkit.ai.detectSafeSearch(avatarURL);
    msg.channel.send(`Explicit Results: ${results ? results.adult : 'No Results'}`);
    msg.channel.send(`Explicit Confidence: ${results ? results.adultConfidence : 'No Results'}`);
}

module.exports.info = {
    name: 'avatar'
}