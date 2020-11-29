import ACMClient from '../Bot';
import { settings } from '../../botsettings';
import { MessageEmbed } from 'discord.js';
import { GoogleSpreadsheet } from 'google-spreadsheet';

interface Event {
    title: string;
    description: string;
    division: string;
    room: string;
    date: Date;
}
export default class NewsletterService {
    public client: ACMClient;
    private spreadsheetId: string;
    private defaultCron: string;

    constructor(client: ACMClient) {
        this.client = client;
        this.spreadsheetId = '1m_Y5ZgOUbAMn-T_gGTzzQ7ruiNKvs-8WFNoPfOuZL8Q';

        // make sure the newspaper task is created/in the db with the appropriate time
        // ? the default time is sunday at 7pm (optimal time for a newsletter imo but idk)
        // TODO: make this changable via a command
        this.defaultCron = '00 01 09 * * 0';

        // this.schedule();
    }

    // schedule the newsletter task
    public async schedule() {
        await this.client.scheduler.createTask({
            id: 'newsletter',
            type: 'newsletter',
            cron: this.defaultCron,
        });
    }

    //
    // Event monitoring and handling //
    //
    public async send() {
        // fetch data from google sheets
        console.log('Running newsletter.send() process!');

        const doc = new GoogleSpreadsheet(this.spreadsheetId);

        doc.useApiKey(settings.keys.sheets);

        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[1];
        const rows = await sheet.getRows();
        const validRows = rows.filter(
            (row: any) => row['Start Time'] != undefined && row['Start Time'] != 'TBA'
        );
        const allEvents: Event[] = validRows.map((row: any) => {
            return {
                title: row['Event Name'],
                description: row['Event Description'],
                division: row['Team/Division'],
                room: row['Room'],
                date: new Date(row.Date + ' ' + row['Start Time']),
            };
        });
        console.log(allEvents);

        // find the events that are for the upcoming week
        let today = new Date();
        const events = allEvents.filter((e) => {
            return (
                e.date > today &&
                e.date < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)
            );
        });

        const ed: any = {};
        events.forEach((e) => (ed[e.division] = [...ed[e.division], e]));

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
            fields: Object.keys(ed).map((division: any) => {
                let str = '';
                ed[division].forEach(
                    (e: Event) =>
                        (str += `**${e.title}** on \`${
                            e.date.toDateString().split(' ')[0]
                        } @ ${this.formatAMPM(e.date)}\`\n`)
                );
                return { name: division, value: str, inline: false };
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

        // remove everyone who is unsubscribed or is a bot
        const subscribed = members?.filter( (member) => 
            !unsubscribed.includes(member.id) && 
            !member.user.bot
        );

        for (let subscriber of subscribed!.values()) {
            try {
                await subscriber.send(newsletter);
            } catch (e) {
                console.log(
                    `Subscriber ${subscriber.user.username} has DMs blocked. Newsletter not sent`
                );
            }
        }
        /*
        subscribed?.forEach(async (member) => {
            const dmChannel = await member.createDM();
            dmChannel.send(newsletter);
        });
        */

        // reschedule a new newsletter task
        this.schedule();
    }

    /**
     * Formats Date object into `HH:MM AM/PM`, in CST
     */
    formatAMPM(date: Date): string {
        const options = {
            timeZone: 'America/Chicago',
            hour: 'numeric', minute: 'numeric'
        }
        return date.toLocaleString("en-US", options);
    }
}
