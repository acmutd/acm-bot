import fs from 'fs';
import path from 'path';
import express, { Express, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import url from 'url';
import bodyParser from 'body-parser';
import ACMClient from '../Bot';
import { file } from 'googleapis/build/src/apis/file';
import { TextChannel } from 'discord.js';

/**
 * Good Reference
 * https://olaralex.com/building-a-nodejs-express-backend-with-typescript/
 * https://developer.okta.com/blog/2018/11/15/node-express-typescript
 */

export default class ExpressManager {
    public client: ACMClient;
    public app: Express;
    public port: number = 1337;
    public path: string = '/home/eric/acm-bot/src/structures/endpoints/';
    public server: http.Server | null = null;
    // move to config
    public privateKeyFile: string = '/etc/letsencrypt/live/acm-bot.tk/privkey.pem';
    public certFile: string = '/etc/letsencrypt/live/acm-bot.tk/cert.pem';
    

    constructor(client: ACMClient) {
        this.client = client;
        this.app = express();

    }

    async setup() {
        //this.setupEndpoints();

        // Certificate
        /*
        const privateKey = fs.readFileSync(this.privateKeyFile, 'utf8');
        const certificate = fs.readFileSync(this.certFile, 'utf8');
        const credentials = {
            key: privateKey,
            cert: certificate,
        };
        */
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.raw());
       

        this.app.post('/mapdiscord', async (req: Request, res: Response) => {
            console.log(req.body);
            
            const ACMGuild = this.client.guilds.cache.find(g => g.id == '744488967465992225');
            if (!ACMGuild) {
                console.log('Please invite me to that guild :(');
                res.status(418).send('-2');
                return;
            }

            const errorChannel = ACMGuild.channels.cache.find(c => c.name === 'htf-registration-errors' && c.type === 'text');
            if (!errorChannel) {
                console.log('Valid error channel couldn\'t be found!');
            }


            const member = ACMGuild.members.cache.find(gm => gm.user.tag == req.body.username);
            if (member) {
                // send off the status
                res.status(200).json({ snowflake: member.id });
                // update roles
                const hacktoberfesterRole = ACMGuild.roles.cache.find(role => role.name === 'hacktoberfester');
                if (!hacktoberfesterRole) {
                    (errorChannel as TextChannel).send('Please create a role called hacktoberfester');
                    console.log('Please create a role called hacktoberfester');
                    return;
                }
                member.roles.add(hacktoberfesterRole);
            }
            else {
                // Send -1 because couldn't find
                res.status(418).json({ snowflake: '-1'});
                (errorChannel as TextChannel).send('Could find user:\n' + JSON.stringify(req.body));
            }
        });


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
        

        fs.readdir(this.path, (err, files) => {
            files.forEach((file) => {
                const com = require(this.path + file);
                com(this.app, this.client);
            });
        });
    }
}
