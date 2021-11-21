import { Channel, MessageReaction, TextChannel, User } from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";
import { RRMessageData } from "../../api/schema";

export default class ReactionRoleManager extends Manager {
  private emojiRegex: RegExp =
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

  constructor(bot: Bot) {
    super(bot);
  }

  public async init(): Promise<void> {
    // Get rero from db
    const allReactionRoles = this.bot.managers.database.cache.rrmessages;

    let reroCounter = 0;
    for (const [messageId, rero] of allReactionRoles) {
      // Fetch rero channel and ensure it is text channel
      const channelId = rero.channel;
      let channel = await this.bot.channels.fetch(channelId);
      if (channel && channel instanceof TextChannel) {
        // Fetch the message and ensure the bot has reacted to it
        let message = await channel.messages.fetch(messageId);
        for (const emote in rero.reactionRoles) {
          if (rero.reactionRoles.hasOwnProperty(emote)) {
            await message.react(emote);
            reroCounter++;
          }
        }
      }
    }

    this.bot.logger.info(`Listening to ${reroCounter} reaction roles.`);
  }

  // Procedure for creating a new reaction role.
  async create(rrData: RRMessageData) {
    // Resolve guild, channel, and message
    let guild = await this.bot.guilds.fetch(rrData.guild);
    let channel = await this.bot.channels.fetch(rrData.channel);
    if (!(channel instanceof TextChannel)) {
      throw "Error resolving channel as text channel. This should never happen.";
    }
    let message = await (channel as TextChannel).messages.fetch(rrData._id);

    // React to the message
    Object.keys(rrData).forEach((key) => {
      if (key.match(this.emojiRegex)) message.react(key);
      else message.react(guild!.emojis.resolve(key)!);
    });

    // Add rero to database
    await this.bot.managers.database.rrmsgAdd(rrData);
  }

  async handleReactionAdd(reaction: MessageReaction, user: User) {
    // Handle partial
    if (reaction.partial) await reaction.fetch();
    await reaction.users.fetch();
    // Ignore some reactions we shouldn't care about
    if (user.bot) return;
    if (!reaction.message.guild) return;

    // Resolve the reaction role message, if any
    const rrmsg = this.bot.managers.database.cache.rrmessages.get(
      reaction.message.id
    );
    if (!rrmsg) return;

    // Resolve the guild member
    const guild = reaction.message.guild;
    const member = guild.members.resolve(user.id!);
    if (!member) return;

    // Add or remove role, depending on if they have the role already
    const hasRole = member.roles.cache.has(
      rrmsg.reactionRoles[
        reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name
      ]
    );
    if (!hasRole) {
      console.log(reaction);
      console.log(reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name);
      console.log(
        rrmsg.reactionRoles[
          reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name
        ]
      );
      await member.roles.add(
        rrmsg.reactionRoles[
          reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name
        ]
      );
    } else
      await member.roles.remove(
        rrmsg.reactionRoles[
          reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name
        ]
      );

    // Remove the user's reaction
    await reaction.users.remove(user.id);
  }
}
