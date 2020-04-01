const toolkit = require('../toolkit.js');

module.exports.run = async (client, member) => {
    // obscenity detection
    const results = await toolkit.ai.detectSafeSearch(member.user.avatarURL());
    if(results.adult == 'LIKELY' || results.adult == 'VERY_LIKELY') {
        member.ban({ days: 7, reason: 'ACM bot detected a \'LIKELY\' or \'VERY_LIKELY\' explicit profile picture.' })
    }
    if(member.user.bot) return;
}

module.exports.info = {
    name: 'guildMemberAdd'
}
