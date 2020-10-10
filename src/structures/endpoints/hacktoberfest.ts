import ACMClient from '../Bot';
import { Request, Response, Express } from "express";
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { settings } from '../../botsettings';

/* Temporary file for handling 2020 Hacktoberfest registration */

module.exports = (app: Express, client: ACMClient) => {
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
    app.post('/mapdiscord', async (req: Request, res: Response) => {
        //console.log(req.body);
            
        /* Bot is not in guild → nothing can be done, return -2 with server error */
        const ACMGuild = client.guilds.cache.find(g => g.id == settings.guild);
        if (!ACMGuild) {
            console.log('The ACM guild cannot be found.');
            res.status(503).json({ snowflake: '-2'});
            return;
        }

        /* No error channel → log and continue */
        const errorChannel = (ACMGuild.channels.cache.find(c => c.id == settings.hacktoberfest.errorChannel) as TextChannel);
        if (!errorChannel)
            console.log('The htf error channel cannot be found.');

        /* No confirmation channel → log and continue */
        const confirmationChannel = (ACMGuild.channels.cache.find(c => c.id == settings.hacktoberfest.confirmationChannel) as TextChannel);
        if (!confirmationChannel)
            console.log('The htf confirmation channel cannot be found.');

        let member: GuildMember | undefined = undefined;
        if (/#\d{4}/.test(req.body.username))
            member = ACMGuild.members.cache.find(gm => gm.user.tag == req.body.username);
        else
            member = ACMGuild.members.cache.find(gm => gm.user.username == req.body.username);


        if (member) {
            // send off the ID first if user is found. If something fails later, log and fix manually
            res.status(200).json({ snowflake: member.id });

            const hacktoberfestRole = ACMGuild.roles.cache.find(role => role.id == settings.hacktoberfest.htfRole);
            if (hacktoberfestRole) {
                member.roles.add(hacktoberfestRole);
                confirmationChannel?.send(`<@${member.id}>, thank you for registering for Hacktoberfest!`);

                // create DM embed with further information
                const verificationEmbed = {
                    color: '#93c2db',
                    title: 'Hacktoberfest Registration Confirmed',
                    description: `Hi **${req.body.name}**, thank you for registering for ACM Hacktoberfest!\n` + 
                        'Also, please check your inbox or spam for a confirmation email.',
                    footer: {
                        text: 'If you did not recently request this action, please contact an ACM staff member.',
                    },
                }

                member.send({embed: verificationEmbed})
                    .catch ((e) => errorChannel.send(`Warning: DMs are off for <@${member?.id}> (${req.body.name})`));
            }
            /* No role to add → log and give up */
            else {
                errorChannel.send('The hacktoberfest role could not be found.');
                console.log('The hacktoberfest role could not be found.');
                return;
            }
            
        }
        /* User not found → return -1 */
        else {
            res.status(418).json({ snowflake: '-1'});
            (errorChannel as TextChannel)?.send('Could not find user:\n' + JSON.stringify(req.body));
        }   
    });
};
