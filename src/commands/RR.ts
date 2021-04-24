import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Wizard, {
    TextWizardNode,
    ChannelMentionWizardNode,
    ColorWizardNode,
    CustomWizardNode,
    YesNoWizardNode,
} from '../utils/Wizard';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import ACMClient from '../structures/Bot';
import { RRMessageData } from '../structures/models/RRMessage';
// Reaction roles command suite. Create and delete reaction roles for automated handling.
export default class RRCommand extends Command {
    constructor() {
        super({
            name: 'rr',
            description: 'Reaction roles suite',
        });
    }
    /**
     * Standard Command Executor
     * @param param0 Command Arguments
     * @returns Optional Emit Promise
     */
    public async exec({ msg, client, args }: CommandContext) {
        switch (args[0]) {
            case 'create':
                await rrCreate(msg, client, args);
                break;
            case 'delete':
                await rrDelete(msg, client, args);
                break;
            case 'link':
                // await rrLink(msg, client, args);
                break;
            case 'buffer':
                // await graphicTest(msg, client, args);
                break;
            default:
                return client.response.emit(
                    msg.channel,
                    `That was an invalid argument. Try again dumbass <@${msg.author.id}>`,
                    'invalid'
                );
        }
    }
}

// async function rrCreate(msg: Message, client: ACMClient, args: string[]) {
//     const quit = () => msg.channel.send('reaction role embed wizard ended');
//     const customEmojiRegEx = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
//     const roleRegEx = /<?@&(\d{17,19})>?/;
//     const emojiRegEx = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
//     var rrObject: any = {};
//     let wizard = new Wizard(msg, undefined, { title: '**🎗 Reaction Roles |** ' });
//     wizard.addNodes([
//         new ChannelMentionWizardNode(wizard, {
//             title: 'Channel',
//             description: 'Mention the channel the reaction role embed is going to be in:',
//         }),
//         new TextWizardNode(wizard, {
//             title: 'Embed Title',
//             description: "What's the title of the embed message?",
//         }),
//         new TextWizardNode(wizard, {
//             title: 'Embed Description',
//             description: "What's the description of the embed message?",
//         }),
//         new ColorWizardNode(
//             wizard,
//             {
//                 title: 'Embed Color',
//                 description:
//                     "(skippable) Enter the hex code of the color of the embed (hashtag included) like '#FFFFFF'.",
//             },
//             { skipValue: undefined }
//         ),
//         new CustomWizardNode(
//             wizard,
//             {
//                 title: 'Emojis and Roles',
//                 description:
//                     "Type the reaction and the role in this format: '<emoji> | <@role>'. \nThe emoji **must** either be a standard emoji, or a custom emoji from **this** server. If not, it will be replaced with ❓.",
//             },
//             (message) => {
//                 let customEmoji = message.content.match(customEmojiRegEx);
//                 let emoji = message.content.match(emojiRegEx);
//                 let role = message.content.match(roleRegEx);
//                 // if(!msg.author.permissions.has(['ADMINISTRATOR'])) {
//                 //     // check if role has power
//                 //     if(isModAdmin(msg, channel, role[role.length-1])) return msg.channel.send('Cannot add a role with high permissions! Try again!');
//                 // }
//                 if (customEmoji == null && emoji == null) {
//                     client.response.emit(
//                         message.channel,
//                         'You did not provide an emoji! Try again!',
//                         'invalid'
//                     );
//                     return;
//                 }
//                 if (role == null) {
//                     client.response.emit(
//                         message.channel,
//                         'You did not provide a role! Try again!',
//                         'invalid'
//                     );
//                     return;
//                 }
//                 // ! [WORKING] do this step when making the actual embed and reacting
//                 if (customEmoji) {
//                     if (!message.guild!.emojis.resolve(customEmoji[3]) && !emoji) emoji = ['❓'];
//                 }
//                 return { emoji, role, customEmoji };
//             },
//             {
//                 loopedCB: (item) => {
//                     const { emoji, customEmoji, role } = item[item.length - 1];
//                     rrObject[emoji ? emoji[0] : customEmoji[3]] = role[role.length - 1];
//                     client.response.emit(
//                         msg.channel,
//                         "Successfully added a reaction role! Type 'done' if you're done, or add another one!",
//                         'success'
//                     );
//                     return { item };
//                 },
//             }
//         ),
//         new YesNoWizardNode(wizard, {
//             title: 'Add Role List?',
//             description:
//                 "Would you like to list the roles and their emojis under your description? Respond with 'yes' or 'no'!",
//         }),
//     ]);
//     let res = await wizard.start();
//     if (res === false) return;

//     const channel = res[0];
//     const title = res[1];
//     const description = res[2];
//     const color = res[3];
//     const shouldList = res[5];

//     // generate role list
//     var roleList = '\n';
//     shouldList
//         ? Object.keys(rrObject).forEach((emojiId) => {
//               if (msg.guild!.emojis.resolve(emojiId)) {
//                   var emoji = msg.guild!.emojis.resolve(emojiId);
//                   var str = '<';
//                   emoji?.animated ? (str += 'a') : '';
//                   roleList += `${str}:${emoji?.name}:${emojiId}> | <@&${rrObject[emojiId]}>\n`;
//               } else {
//                   roleList += `${emojiId} | <@&${rrObject[emojiId]}>\n`;
//               }
//           })
//         : null;

//     var rrEmbed = new MessageEmbed();
//     rrEmbed.setTitle(title ? title : '');
//     rrEmbed.setDescription(
//         shouldList
//             ? description
//                 ? description + roleList
//                 : roleList
//             : description
//             ? description
//             : ''
//     );
//     rrEmbed.setColor(color);
//     var rrEmbMsg = await (msg.guild!.channels.resolve(channel.id) as TextChannel).send(rrEmbed);

//     var reactionRole: any = {};
//     reactionRole['_id'] = rrEmbMsg.id;
//     reactionRole.guild = rrEmbMsg.guild?.id;
//     reactionRole.channel = rrEmbMsg.channel.id;
//     reactionRole.type = 'normal';
//     reactionRole.reactionRoles = rrObject;

//     Object.keys(rrObject).forEach((key) => {
//         if (key.match(emojiRegEx)) rrEmbMsg.react(key);
//         else rrEmbMsg.react(msg.guild!.emojis.resolve(key)!);
//     });

//     try {
//         await client.database.rrmsgAdd(reactionRole);
//         client.response.emit(
//             msg.channel,
//             'Successfully created a reaction role message!',
//             'success'
//         );
//     } catch (err) {
//         client.logger.error(err);
//         client.response.emit(
//             msg.channel,
//             'There was an issue add a reaction role to the DB',
//             'error'
//         );
//     }
// }

async function rrCreate(msg: Message, client: ACMClient, args: string[]) {
    const quit = () => msg.channel.send('reaction role embed wizard ended');
    const customEmojiRegEx = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;
    const roleRegEx = /<?@&(\d{17,19})>?/;
    const emojiRegEx = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    const idRegEx = /(\d{17,19})/g;
    var rrObject: any = {};
    let wizard = new Wizard(msg, undefined, { title: '**🎗 Reaction Roles |** ' });
    wizard.addNodes([
        new CustomWizardNode(
            wizard,
            {
                title: 'Message Link',
                description: 'Enter the link of the message like duh tf????',
            },
            (message) => {
                let ids = message.content.match(idRegEx);
                if (ids && ids.length >= 3) return ids;
            }
        ),
        new CustomWizardNode(
            wizard,
            {
                title: 'Emojis and Roles',
                description:
                    "Type the reaction and the role in this format: '<emoji> | <@role>'. \nThe emoji **must** either be a standard emoji, or a custom emoji from **this** server. If not, it will be replaced with ❓.",
            },
            (message) => {
                let customEmoji = message.content.match(customEmojiRegEx);
                let emoji = message.content.match(emojiRegEx);
                let role = message.content.match(roleRegEx);
                // if(!msg.author.permissions.has(['ADMINISTRATOR'])) {
                //     // check if role has power
                //     if(isModAdmin(msg, channel, role[role.length-1])) return msg.channel.send('Cannot add a role with high permissions! Try again!');
                // }
                if (customEmoji == null && emoji == null) {
                    client.response.emit(
                        message.channel,
                        'You did not provide an emoji! Try again!',
                        'invalid'
                    );
                    return;
                }
                if (role == null) {
                    client.response.emit(
                        message.channel,
                        'You did not provide a role! Try again!',
                        'invalid'
                    );
                    return;
                }
                // ! [WORKING] do this step when making the actual embed and reacting
                if (customEmoji) {
                    if (!message.guild!.emojis.resolve(customEmoji[3]) && !emoji) emoji = ['❓'];
                }
                return { emoji, role, customEmoji };
            },
            {
                loopedCB: (item) => {
                    const { emoji, customEmoji, role } = item[item.length - 1];
                    rrObject[emoji ? emoji[0] : customEmoji[3]] = role[role.length - 1];
                    client.response.emit(
                        msg.channel,
                        "Successfully added a reaction role! Type 'done' if you're done, or add another one!",
                        'success'
                    );
                    return { item };
                },
                timer: 40,
            }
        ),
    ]);
    let res = await wizard.start();
    if (res === false) return;

    const guildID = res[0][0];
    const channelID = res[0][1];
    const messageID = res[0][2];

    var reactionRole: any = {};
    reactionRole['_id'] = messageID;
    reactionRole.guild = guildID;
    reactionRole.channel = channelID;
    reactionRole.type = 'normal';
    reactionRole.reactionRoles = rrObject;

    try {
        await client.services.rr.create(reactionRole);
        client.response.emit(
            msg.channel,
            'Successfully created a reaction role message!',
            'success'
        );
    } catch (e) {
        client.response.emit(msg.channel, e, 'error');
    }

    // try {
    //     // const guild = await client.guilds.fetch(guildID);
    //     const channel = await client.channels.fetch(channelID);
    //     if (channel instanceof TextChannel) {
    //         var message = await (channel as TextChannel).messages.fetch(messageID);
    //     } else {
    //         client.response.emit(
    //             msg.channel,
    //             "The channel referenced wasn't a text channel. This technically shouldn't ever happen if you provided a proper message link",
    //             'error'
    //         );
    //         throw Error;
    //     }
    // } catch (e) {
    //     client.response.emit(
    //         msg.channel,
    //         'There was an issue add a reaction role to the DB',
    //         'error'
    //     );
    //     console.log(e);

    //     return;
    // }

    // Object.keys(rrObject).forEach((key) => {
    //     if (key.match(emojiRegEx)) message.react(key);
    //     else message.react(msg.guild!.emojis.resolve(key)!);
    // });

    // try {
    //     await client.database.rrmsgAdd(reactionRole);
    //     client.response.emit(
    //         msg.channel,
    //         'Successfully created a reaction role message!',
    //         'success'
    //     );
    // } catch (err) {
    //     client.logger.error(err);
    //     client.response.emit(
    //         msg.channel,
    //         'There was an issue add a reaction role to the DB',
    //         'error'
    //     );
    // }
}

async function rrDelete(msg: Message, client: ACMClient, args: string[]) {}
