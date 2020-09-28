import ACMClient from '../Bot';
import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common'
//import { OAuth2Client } from 'google-auth-library'; // apparently this one doesn't have the same methods
import path from 'path';
import fs from 'fs';

export default class CalendarManager {
    public client: ACMClient;
    public calendar: calendar_v3.Calendar;
    public oauth2: OAuth2Client | null = null;
    public calendarId: string;
    public nextSyncToken: string | null | undefined = null;

    constructor(client: ACMClient) {
        this.client = client;
        this.calendar = google.calendar('v3');
        // move into config. ACM Calendar
        this.calendarId = 'c_vr4m53270cbovs7qrnirtqbojo@group.calendar.google.com';
    }

    public async setup() {
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

    /**
     * Retrieve calendar event updates from GCal
     */
    async reloadCalendar() : Promise<boolean> {
        let res = 'Success! Check the command line for your updated calendar events';
        let calArgs: calendar_v3.Params$Resource$Acl$List = {
            'calendarId': this.calendarId
        };

        if (this.nextSyncToken) {
            calArgs['syncToken'] = this.nextSyncToken;
        }

        const response = await this.calendar.events.list(calArgs);
        //console.log(response);
        // Check if syncToken as expired. If so, we need to do a full reload.
        if (response.status == 410) {
            console.log('SyncToken expired, trying again');
            this.nextSyncToken = '';
            return this.reloadCalendar();
        } else if (response.status != 200) {
            const res: number = response.status;
            console.log('Something went wrong with retrieving the calendar data');
            return false;
        } else {
            this.nextSyncToken = response.data.nextSyncToken;
            //console.log(response.data);
            /**
             * can also just filter using the updated field so that we skip over
             * processing old content
             * this should change into something that actually updates stuff, either inside this
             *    function or by calling another one
             */
            if (!response.data.items) {
                console.log('This shouldn\'t happen but I\'m too lazy to fix it');
                return false;
            }
            for (var item of response.data.items) {
                console.log('\n== Event updated ==\nStatus: ' + item.status);
                if (item.status == 'confirmed') {
                    console.log('Name:  ' + item.summary);
                    console.log('ID: ' + item.id);
                    console.log('Start: ' + item.start?.dateTime);
                    console.log('End: ' + item.end?.dateTime);
                } else if (item.status == 'cancelled') {
                    console.log('ID: ' + item.id);
                } else {
                    console.log(item);
                }
            }
        }
        return true;
    }
}
