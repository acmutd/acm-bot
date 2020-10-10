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

        this.app.listen(this.port, () => {
            this.client.logger.info(`Express server started on port ${this.port}!`);
        });


       //this.server = https.createServer(credentials, this.app);
       //this.server = http.createServer(this.app);
       //this.server.listen(this.port, (() => console.log('Express server started, ' + this.server?.listenerCount('get') + 'listeners')));      
    }

    setupEndpoints() {
        // readdir is relative to process cwd, so we need to convert to abs path
        fs.readdir(__dirname + this.path, (err, files) => {
            files.forEach((file) => {
                require(this.path + file)(this.app, this.client);
                this.client.logger.info(`Registered endpoints in '${file}'!`);
            });
        });


    }
}
