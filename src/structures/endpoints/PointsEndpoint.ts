import ACMClient from '../Bot';
import { Request, Response, Express } from "express";
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { settings } from '../../botsettings';

/* Temporary file for handling 2020 Hacktoberfest registration */

module.exports = (app: Express, client: ACMClient) => {
    /**
     * Accepts typeform responses
     */
    app.post('/typeform', async (req: Request, res: Response) => {
        console.log(JSON.stringify(req.body, null, 2));
        client.services.points.handleTypeform(req.body);
        res.status(200).end();
    });
};
