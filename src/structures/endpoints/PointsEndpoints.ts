import ACMClient from '../Bot';
import { Request, Response, Express } from "express";
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { settings } from '../../botsettings';

/* File containing endpoints that handle anything related to the points system */

module.exports = (app: Express, client: ACMClient) => {
    // Activities form endpoint for typeform
    app.post('/points-form', async (req: Request, res: Response) => {
        res.status(200).end();
        client.services.points.handlePointsTypeform(req.body);
    });
    // Registration form endpoint for typeform to hit
    app.post('/registration-form', async (req: Request, res: Response) => {
        res.status(200).end();
        client.services.points.handleRegistrationTypeform(req.body);
    });
};
