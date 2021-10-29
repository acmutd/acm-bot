const ENV = 'DEV';

const devConfig = {
    token: 'token',
    prefix: 'dev.',
    activity: {
        type: 'WATCHING',
        description: 'young engineers grow 😭🤍',
    },
    sentryDNS: 'sentry dns',
    databaseURL: 'database url',
    firestore: {
        projectId: 'acm-core',
        keyFilename: 'acm-core.json',
    },
    express: {
        port: 'port',
        privateKey: '',
        cert: '',
    },
    // newly added
    keys: {
        sheets: 'sheets key',
    },
    responseFormat: 'embed',
    // ^ can also be 'simple'
    disabledCommands: [],
    disabledCategories: [],
    guild: 'guild number',
    acmLogoURL: 'logo url',
    points: {
        privateChannel: 'channel id',
        publicChannel: 'channel id',
        staffRole: 'channel id',
    },
    channels: {
        verification: 'channel id',
        error: 'channel id',
        shoutout: 'channel id',
        circles: 'channel id',
        circlesCategory: 'channel id',
        roles: 'channel id',
    },
    roles: {
        member: 'role id',
        staff: 'role id',
        director: 'role id',
        mute: 'role id',
        divisions: {
            projects: 'role id',
            education: 'role id',
            hackutd: 'role id',
        },
    },
};

const prodConfig = {
    token: 'token',
    prefix: '.',
    activity: {
        type: 'WATCHING',
        description: 'young engineers grow 😭🤍',
    },
    sentryDNS: 'sentry dns',
    databaseURL: 'database url',
    firestore: {
        projectId: 'acm-core',
        keyFilename: 'acm-core.json',
    },
    express: {
        port: 1337,
        privateKey: '',
        cert: '',
    },
    keys: {
        sheets: 'sheets url',
    },
    responseFormat: 0,
    disabledCommands: [],
    disabledCategories: [],
    guild: 'guild id',
    acmLogoURL: 'logo url',
    points: {
        privateChannel: 'channel id',
        publicChannel: 'channel id',
        staffRole: 'channel id',
    },
    channels: {
        verification: 'channel id',
        error: 'channel id',
        shoutout: 'channel id',
        circles: 'channel id',
        circlesCategory: 'channel id',
        roles: 'channel id',
    },
    roles: {
        member: 'role id',
        staff: 'role id',
        director: 'role id',
        muted: 'role id',
        divisions: {
            projects: 'role id',
            education: 'role id',
            hackutd: 'role id',
            development: 'role id',
            research: 'role id',
        },
    },
};

module.exports = ENV == 'DEV' ? devConfig : prodConfig;