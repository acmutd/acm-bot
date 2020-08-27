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
    responseFormat: ResponseFormat;
    disabledCommands: string[];
    disabledCategories: string[];
    guild: string;
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
