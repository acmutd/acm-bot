import fs from 'fs';
import path from 'path';
import express, { Express, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import url from 'url';
import bodyParser from 'body-parser';
import ACMClient from '../Bot';
import { settings } from '../../botsettings';
import { file } from 'googleapis/build/src/apis/file';
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';

/**
 * Good Reference
 * https://olaralex.com/building-a-nodejs-express-backend-with-typescript/
 * https://developer.okta.com/blog/2018/11/15/node-express-typescript
 */

export default class ExpressManager {
    public client: ACMClient;
    public app: Express;
    public port: number;
    public confirmationChannelID: string;
    public errorChannelID: string;
    public hacktoberfestRoleID: string;
    public path: string = '../endpoints/';
    public server: http.Server | null = null;
    // move to config
    public privateKeyFile: string;
    public certFile: string;
    

    constructor(client: ACMClient) {
        this.client = client;
        this.app = express();

        this.port = settings.express.port;
        this.privateKeyFile = settings.express.privateKey;
        this.certFile = settings.express.cert;

        this.confirmationChannelID = settings.hacktoberfest.confirmationChannel;
        this.errorChannelID = settings.hacktoberfest.errorChannel;
        this.hacktoberfestRoleID = settings.hacktoberfest.htfRole;
    }


    async setup() {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw());

        this.setupEndpoints();

        // Certificate
        /*
        const privateKey = fs.readFileSync(this.privateKeyFile, 'utf8');
        const certificate = fs.readFileSync(this.certFile, 'utf8');
        const credentials = {
            key: privateKey,
            cert: certificate,
        };
        */

       

        /**
         * Takes in json with at least a full discord username { username: "user#discrim" }
         * 
         * Returns the following:
         * 
         * User found            → status = 200, data = { snowflake: 'userID' }
         * User not found        → status = 418, data = { snowflake: '-1' }
         * Bot setup not correct → status = 503, data = { snowflake: '-2' }
         * 
         */
        
        //this.app.post('/mapdiscord', async (req: Request, res: Response) => {
        //    console.log(req.body);
        //    
        //    /* Bot is not in guild → nothing can be done, return -2 with server error */
        //    const ACMGuild = this.client.guilds.cache.find(g => g.id == settings.guild);
        //    if (!ACMGuild) {
        //        console.log('The ACM guild cannot be found.');
        //        res.status(503).json({ snowflake: '-2'});
        //        return;
        //    }
//
        //    /* No error channel → log and continue */
        //    const errorChannel = (ACMGuild.channels.cache.find(c => c.id == this.errorChannelID) as TextChannel);
        //    if (!errorChannel)
        //        console.log('The htf error channel cannot be found.');
//
        //    /* No confirmation channel → log and continue */
        //    const confirmationChannel = (ACMGuild.channels.cache.find(c => c.id == this.confirmationChannelID) as TextChannel);
        //    if (!confirmationChannel)
        //        console.log('The htf confirmation channel cannot be found.');
//
        //    console.log(ACMGuild.members.cache.size);
        //    let member: GuildMember | undefined = undefined;
        //    if (/#\d{4}/.test(req.body.username))
        //        member = ACMGuild.members.cache.find(gm => gm.user.tag == req.body.username);
        //    else
        //        member = ACMGuild.members.cache.find(gm => gm.user.username == req.body.username);
//
//
        //    if (member) {
        //        // send off the ID first if user is found. If something fails later, log and fix manually
        //        res.status(200).json({ snowflake: member.id });
//
        //        const hacktoberfestRole = ACMGuild.roles.cache.find(role => role.id == this.hacktoberfestRoleID);
        //        if (hacktoberfestRole) {
        //            member.roles.add(hacktoberfestRole);
        //            confirmationChannel?.send(`<@${member.id}>, thank you for registering for Hacktoberfest!`);
//
        //            // create DM embed with further information
        //            const verificationEmbed = {
        //                color: '#93c2db',
        //                title: 'Hacktoberfest Registration Confirmed',
        //                description: `Hi **${req.body.name}**, thank you for registering for ACM Hacktoberfest!\n` + 
        //                    'Also, please check your inbox or spam for a confirmation email.',
        //                footer: {
        //                    text: 'If you did not recently request this action, please contact an ACM staff member.',
        //                },
        //            }
//
        //            member.send({embed: verificationEmbed})
        //                .catch ((e) => errorChannel.send(`Warning: DMs are off for <@${member?.id}> (${req.body.name})`));
        //        }
        //        /* No role to add → log and give up */
        //        else {
        //            errorChannel.send('The hacktoberfest role could not be found.');
        //            console.log('The hacktoberfest role could not be found.');
        //            return;
        //        }
        //        
        //    }
        //    /* User not found → return -1 */
        //    else {
        //        res.status(418).json({ snowflake: '-1'});
        //        (errorChannel as TextChannel)?.send('Could not find user:\n' + JSON.stringify(req.body));
        //    }
        //});
        

        this.app.listen(this.port, () => {
            console.log(`Express server started on port ${this.port}`);
        });


       //this.server = https.createServer(credentials, this.app);
       //this.server = http.createServer(this.app);
       //this.server.listen(this.port, (() => console.log('Express server started, ' + this.server?.listenerCount('get') + 'listeners')));

       
    }

    setupEndpoints() {
        // Tell express to use body-parser's JSON parsing
        this.app.use(bodyParser.json());
        

        // readdir is relative to process cwd, so we need to convert to abs path
        console.log(__dirname + this.path);
        fs.readdir(__dirname + this.path, (err, files) => {
            files.forEach((file) => {
                require(this.path + file)(this.app, this.client);
            });
        });
    }
}
