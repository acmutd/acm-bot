"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = __importDefault(require("../api/command"));
const wizard_1 = __importStar(require("../util/wizard"));
const settings_1 = require("../settings");
class CircleCommand extends command_1.default {
    constructor() {
        super({
            name: 'circle',
            description: 'A suite of command that manage ACM Community Circles...',
            dmWorks: false,
            userPermissions: 268443664
        });
    }
    exec({ msg, bot, args }) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (args[0]) {
                case 'add':
                    yield addCircle(bot, msg, args);
                    break;
                case 'repost':
                    yield bot.managers.circle.repost();
                    break;
                default:
                    msg.channel.send(`User '${settings_1.settings.prefix}circle help' to show a list of commands...`);
                    break;
            }
        });
    }
}
exports.default = CircleCommand;
function addCircle(bot, msg, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const wizard = new wizard_1.default(msg, undefined, { title: '__**Circle Creation**__ ' });
        wizard.addNodes([
            new wizard_1.UserMentionWizardNode(wizard, {
                title: 'Owner',
                description: `Who's the owner of the circle? (mention them)`
            }),
            new wizard_1.TextWizardNode(wizard, {
                title: 'Name',
                description: `What's the circle name?`
            }),
            new wizard_1.TextWizardNode(wizard, {
                title: 'Description',
                description: `What's the circle description?`
            }),
            new wizard_1.ColorWizardNode(wizard, {
                title: 'Color',
                description: `What's the circle color? (used for the embed & role)`
            }),
            new wizard_1.EmojiWizardNode(wizard, {
                title: 'Emoji',
                description: `What's the circle's emoji?`
            }),
            new wizard_1.GraphicWizardNode(wizard, {
                title: 'Image',
                description: `What's the circle's graphic/image? (url)`
            })
        ]);
        const res = yield wizard.start();
        if (res === false)
            return;
        const circle = {
            name: res[1],
            description: res[2],
            emoji: res[4][0],
            imageUrl: res[5],
            createdOn: new Date(),
            owner: res[0].id
        };
        try {
            var owner = yield msg.guild.members.fetch(res[0].id);
        }
        catch (err) {
            bot.response.emit(msg.channel, `Could not find member in the guild...`, 'error');
            return;
        }
        const circleRole = yield msg.guild.roles.create({
            data: { name: `${circle.emoji} ${circle.name}`, mentionable: true, color: res[3] }
        });
        owner.roles.add(circleRole);
        const permissions = [
            {
                id: msg.guild.id,
                deny: ['VIEW_CHANNEL'],
                type: 'role'
            },
            {
                id: circleRole,
                allow: ['VIEW_CHANNEL'],
                type: 'role'
            }
        ];
        const circleCategory = msg.guild.channels.cache.get(settings_1.settings.channels.circlesCategory);
        const desc = `🎗️: ${circleRole.name}`;
        const circleChannel = yield msg.guild.channels.create(`${circle.emoji} ${circle.name}`, {
            type: 'text',
            topic: desc,
            parent: circleCategory,
            permissionOverwrites: permissions
        });
        circle['_id'] = circleRole.id;
        circle.channel = circleChannel.id;
        circle.owner = owner.id;
        const added = yield bot.managers.database.circleAdd(circle);
        if (!added) {
            bot.response.emit(msg.channel, `Could not add circle to the database...`, 'error');
            circleRole.delete();
            circleChannel.delete();
            return;
        }
        bot.response.emit(msg.channel, `Successfully created circle <@&${circleRole.id}>...`, 'success');
    });
}
