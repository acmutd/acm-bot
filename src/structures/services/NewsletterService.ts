import ACMClient from '../Bot';
import { settings } from '../../botsettings';
import { MessageEmbed } from 'discord.js';
import { google, sheets_v4 } from 'googleapis';
import axios from 'axios';

export default class NewsletterService {
    public client: ACMClient;
    //private sheets: sheets_v4.Sheets;
    private url: string;

    constructor(client: ACMClient) {
        this.client = client;
        //this.sheets = google.sheets({ version: 'v4', auth: settings.keys.sheets });
        this.url = `https://sheets.googleapis.com/v4/spreadsheets/1a_Blxq4Cs-QStPoOIRvSgq1_9hZhRNFn2sPzPDC2-NY?key=${settings.keys.sheets}`;
    }

    //
    // Event monitoring and handling //
    //
    public async send() {
        /*
        this.sheets.spreadsheets.values.get(
            {
                spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
                range: 'Class Data!A2:E',
            },
            (err, res) => {
                if (err) return console.log('The API returned an error: ' + err);
                const rows = res.data.values;
                if (rows.length) {
                    console.log('Name, Major:');
                    // Print columns A and E, which correspond to indices 0 and 4.
                    rows.map((row) => {
                        console.log(`${row[0]}, ${row[4]}`);
                    });
                } else {
                    console.log('No data found.');
                }
            }
        );
        */

        // fetch data from google sheets
        const response = await axios.get(this.url);
        const events = response.data.sheets[0].data[0].rowData.map((row: any) => {
            return {
                name: row.values[2].effectiveValue.stringValue,
                date: row.values[1].effectiveValue.stringValue,
            };
        });

        console.log(events);

        // res.json
        // format json
        // create a basic embed
        let newsletter = new MessageEmbed({
            title: "📰 __ACM's Weekly Newsletter__",
            description:
                '\n- Respond with a number to RSVP for an event!\n\n- Respond with `unsubscribe` to unsubscribe from the ACM weekly newsletter.\n``',
            author: {
                name: 'The Association for Computing Machinery',
                icon_url: settings.acmLogoURL,
            },
            color: 16738560,
            footer: {
                text: 'Newsletter',
            },
            fields: events.map((e: any) => {
                return { name: e.name, value: e.date, inline: false };
            }),
        });

        // loop through all members in member schema, and find the members with preferences.subscribed = false;
        const unsubscribed = await this.client.database.schemas.member
            .find({
                'preferences.subscribed': false,
            })
            .map((el: any) => el['_id']);
        console.log(unsubscribed);
        // send to every member in client.members - unsubscribed
        const members = await this.client.guilds.resolve(settings.guild)?.members.fetch();
        const subscribed = members?.filter((member) => !unsubscribed.includes(member.id));

        for (let subscriber of subscribed?.values()!) {
            try {
                subscriber.send(newsletter);
            } catch (e) {
                console.log(
                    `Subscriber ${subscriber.user.username} has DMs blocked. Newsletter not sent`
                );
            }
        }
        subscribed?.forEach(async (member) => {
            const dmChannel = await member.createDM();
            dmChannel.send(newsletter);
        });
        //
    }
}
