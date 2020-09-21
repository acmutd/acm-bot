import ACMClient from '../Bot';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export default class CalendarManager {
    public client: ACMClient;
    public calendar: any;
    public oauth2: any;

    constructor(client: ACMClient) {
        this.client = client;
    }

    public async setup() {
        this.calendar = google.calendar('v3');
        let keyPath = path.join(__dirname, 'client_secret.json');
        let keys: any = { redirect_uris: [''] };
        if (fs.existsSync(keyPath)) {
            keys = require(keyPath).web;
        }
        this.oauth2 = new google.auth.OAuth2(
            keys.client_id,
            keys.client_secret,
            keys.redirect_uris[0]
        );
        google.options({ auth: this.oauth2 });
    }

    async reloadCalendar() {
        // res = 'Success! Check the command line for your updated calendar events';
        // calArgs = {};
        // calArgs['calendarId'] = 'c_vr4m53270cbovs7qrnirtqbojo@group.calendar.google.com';
        // if (nextSyncToken) {
        //     calArgs['syncToken'] = nextSyncToken;
        // }
        // const response = await calendar.events.list(calArgs);
        // //console.log(response);
        // if (response.status == 410) {
        //     console.log('SyncToken expired, trying again');
        //     nextSyncToken = null;
        //     return this.reloadCalendar();
        // } else if (response.status != 200) {
        //     res = resonse.status;
        //     console.log('Something went wrong with retrieving the calendar data');
        // } else {
        //     nextSyncToken = response.data.nextSyncToken;
        //     //console.log(response.data);
        //     // can also just filter using the updated field so that we skip over
        //     // processing old content
        //     for (item of response.data.items) {
        //         console.log('\n== Event updated ==\nStatus: ' + item.status);
        //         if (item.status == 'confirmed') {
        //             console.log('Name:  ' + item.summary);
        //             console.log('ID: ' + item.id);
        //             console.log('Start: ' + item.start.dateTime);
        //             console.log('End: ' + item.end.dateTime);
        //         } else if (item.status == 'cancelled') {
        //             console.log('ID: ' + item.id);
        //         } else {
        //             console.log(item);
        //         }
        //     }
        // }
        // return res;
    }
}
