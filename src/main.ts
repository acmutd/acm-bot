import ACMClient from "./structures/Bot";
import * as path from 'path';

let client: ACMClient = new ACMClient(
    { 
        // token: process.env.TOKEN!, 
        token: 'Njk1MTAyMTc1Mzk4ODU0Nzg4.XoVSbQ.-obeKghH4un5rAPjAfxHc7RZ704',
        dbUrl: 'mongodb://localhost:27017/acmbot',
        sentryDSN: 'https://73943eb19f734c6990d8cf04eda01fc8@o386503.ingest.sentry.io/5220888',
        commandPath: path.join(process.cwd(), 'dist', 'commands'),
        eventPath: path.join(process.cwd(), 'dist', 'events'),
        responseFormat: 'simple',
        disabledCommands: [],
        disabledCategories: []
    }
);

client.start();