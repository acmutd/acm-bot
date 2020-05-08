import { ResponseFormat } from "./utils/Responses";

export interface Settings {
    token: string, 
    prefix: string,
    activity: {
        type: "WATCHING" | "STREAMING" | "LISTENING",
        description: string,
    },
    sentryDNS: string,
    databaseURL: string,
    responseFormat: ResponseFormat,
    disabledCommands: string[],
    disabledCategories: string[],
    channels: {
        verification: string,
        error: string
    },
    roles: {
        member: string
    }
}

export const settings: Settings = require('../botconfig.js') as Settings;
