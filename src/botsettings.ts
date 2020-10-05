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
    express: {
        port: number,
        privateKey: string,
        cert: string,
    };
    responseFormat: ResponseFormat;
    disabledCommands: string[];
    disabledCategories: string[];
    guild: string;
    hacktoberfest: {
        confirmationChannel: string;
        errorChannel: string;
        htfRole: string;
    }
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
