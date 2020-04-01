const toolkit = require('../toolkit.js');

module.exports.run = async (client, oldUser, newUser) => {
    if(oldUser.avatar != newUser.avatar) {
        const results = await toolkit.ai.detectSafeSearch(member.user.avatarURL());
        if(results.adult == 'LIKELY' || results.adult == 'VERY_LIKELY') {
            var member = client
            member.ban({ days: 1, reason: 'ACM bot detected a \'LIKELY\' or \'VERY_LIKELY\' explicit profile picture.' })
        }
    }
}

module.exports.info = {
    name: 'userUpdate'
}