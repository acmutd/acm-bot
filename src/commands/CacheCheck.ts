import Command from '../structures/Command';
import { CommandContext } from '../structures/Command';
import Member from '../structures/models/Member';
import Wizard, {
    TextWizardNode,
    UserMentionWizardNode,
    OptionsWizardNode,
    ChannelMentionWizardNode,
} from '../utils/Wizard';
import { Intents } from 'discord.js';

export default class CacheCheckCommand extends Command {
    constructor() {
        super({
            name: 'cacheCheck',
            description: 'sends the link to ur cacheCheck',
        });
    }

    public async exec({ msg, client, args }: CommandContext) {
        if (msg.mentions.users.array.length > 0) {
            const memberId = msg.guild?.members.cache.get(msg.mentions.users.first()!.id);
            msg.channel.send(memberId + ' ' + String(msg.guild?.members.cache.size));
        }
    }
}
