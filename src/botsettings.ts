import { ResponseFormat } from './utils/Responses';

export interface Settings {
    token: string;
    prefix: string;
    activity: {
        type: 'WATCHING' | 'STREAMING' | 'LISTENING';
        description: string;
    };
    sentryDNS: string;
    databaseURL: string;
    firestore: {
        projectId: string;
        keyFilename: string;
    };
    express: {
        port: number;
        privateKey: string;
        cert: string;
    };
    // newly added
    keys: {
        sheets: string;
    };
    responseFormat: ResponseFormat;
    disabledCommands: string[];
    disabledCategories: string[];
    guild: string;
    acmLogoURL: string;
    sheets: {
        calendarURL: string;
    };
    hacktoberfest: {
        confirmationChannel: string;
        errorChannel: string;
        logChannel: string;
        memberRole: string;
        staffRole: string;
    };
    channels: {
        verification: string;
        error: string;
        bulletin: string;
    };
    roles: {
        member: string;
        director: string;
        mute: string;
        divisions: {
            projects: string;
            education: string;
            hackutd: string;
        };
    };
}

export const settings: Settings = require('../botconfig.js') as Settings;
