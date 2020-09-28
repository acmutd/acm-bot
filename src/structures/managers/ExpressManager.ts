import fs = require('fs');
import url = require('url');
import express from 'express';
import https from 'https';
import bodyParser from 'body-parser';
import ACMClient from '../Bot';
import { file } from 'googleapis/build/src/apis/file';

export default class ExpressManager {
    public client: ACMClient;
    public app: any;
    public port: number = 1337;
    public path: string = '../routes';
    public server: any;
    // move to config
    public privateKeyFile: string = '/etc/letsencrypt/live/acm-bot.tk/privkey.pem';
    public certFile: string = '/etc/letsencrypt/live/acm-bot.tk/cert.pem';
    

    constructor(client: ACMClient) {
        this.client = client;
    }

    async setup() {
        this.app = express();
        this.setupEndpoints();

        // Certificate
        const privateKey = fs.readFileSync(this.privateKeyFile, 'utf8');
        const certificate = fs.readFileSync(this.certFile, 'utf8');
        const credentials = {
            key: privateKey,
            cert: certificate,
        };

        this.server = https.createServer(credentials, this.app);
        this.server.listen(this.port);
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
