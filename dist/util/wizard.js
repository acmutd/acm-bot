"use strict";
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
exports.YesNoWizardNode = exports.ConfirmationWizardNode = exports.OptionsWizardNode = exports.RoleMentionWizardNode = exports.ChannelMentionWizardNode = exports.UserMentionWizardNode = exports.GraphicWizardNode = exports.ColorWizardNode = exports.TextWizardNode = exports.EmojiWizardNode = exports.CustomWizardNode = exports.WizardNode = void 0;
const discord_js_1 = require("discord.js");
const checker_1 = __importDefault(require("./checker"));
var StringReplacements;
(function (StringReplacements) {
    StringReplacements["TIME"] = "<time>";
})(StringReplacements || (StringReplacements = {}));
class Wizard {
    constructor(message, defaults, additions) {
        this.nodes = [];
        this.message = message;
        this.defaults = defaults;
        this.additions = additions;
        this.configs = this.setConfigs();
    }
    setConfigs() {
        return {
            commands: {
                quit: "quit",
                skip: "skip",
                doneLoop: "done",
            },
            responses: {
                quit: "Quitting wizard...",
                skip: "",
                doneLoop: "Loop ended...",
                time: "⏰ You ran out of time (+<time> seconds). Ending wizard...",
                error: "Unexpected issue with the setup wizard, aborting...",
            },
        };
    }
    addNode(node) {
        this.nodes.push(node);
    }
    addNodes(nodes) {
        this.nodes.push(...nodes);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [];
            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i];
                const response = yield node.emit();
                if (response.status === WizardNodeResponseStatus.INCOMPLETE)
                    return false;
                responses.push(response.item);
            }
            return responses;
        });
    }
}
exports.default = Wizard;
var WizardNodeResponseStatus;
(function (WizardNodeResponseStatus) {
    WizardNodeResponseStatus[WizardNodeResponseStatus["COMPLETE"] = 0] = "COMPLETE";
    WizardNodeResponseStatus[WizardNodeResponseStatus["INCOMPLETE"] = 1] = "INCOMPLETE";
})(WizardNodeResponseStatus || (WizardNodeResponseStatus = {}));
const messageEmbedOptionKeys = [
    "title",
    "description",
    "url",
    "timestamp",
    "color",
    "fields",
    "files",
    "author",
    "thumbnail",
    "image",
    "video",
    "footer",
];
class WizardNode {
    constructor(wizard, overwrites, options) {
        this.wizard = wizard;
        this.options = options || { timer: 20 };
        this.timer = (options === null || options === void 0 ? void 0 : options.timer) || 20;
        this.overwrites = overwrites;
    }
    implementDefaults(overwrites) {
        let details = overwrites;
        if (this.wizard.defaults) {
            details = this.wizard.defaults;
            messageEmbedOptionKeys.forEach((key) => {
                if (this.overwrites[key] && details[key])
                    details[key] = this.overwrites[key];
            });
        }
        if (this.wizard.additions) {
            const additions = this.wizard.additions;
            messageEmbedOptionKeys.forEach((key) => {
                if (typeof additions[key] === "string" &&
                    typeof details[key] === "string")
                    details[key] = (additions[key] + details[key]);
            });
        }
        return details;
    }
    emit() {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let details = this.implementDefaults(this.overwrites);
            if (!details.footer) {
                details.footer = {
                    text: `${this.options.loopedCB
                        ? "Enter '" +
                            this.wizard.configs.commands.doneLoop +
                            "' when you're finished. "
                        : ""}Enter '${this.wizard.configs.commands.quit}' to end the wizard...`,
                };
            }
            try {
                const cb = yield this.preSendCB(details);
                if (cb)
                    details = cb;
            }
            catch (err) {
                console.log(err);
            }
            if (this.options.loopedCB) {
                let item = [];
                let failed = false;
                let defaultColor = details.color;
                do {
                    do {
                        if (failed) {
                            details.color = "RED";
                            if (this.options.invalidMessage)
                                this.wizard.message.channel.send(this.options.invalidMessage);
                        }
                        let embed = new discord_js_1.MessageEmbed(details);
                        var wizardNode = yield this.wizard.message.channel.send({ embed });
                        try {
                            var response = yield this.wizard.message.channel.awaitMessages((m) => m.author.id === this.wizard.message.author.id, { max: 1, time: this.timer * 1000, errors: ["time"] });
                        }
                        catch (err) {
                            this.wizard.message.channel.send(this.wizard.configs.responses.time.replace(StringReplacements.TIME, this.timer.toString()));
                            return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                        }
                        if (((_a = response.first()) === null || _a === void 0 ? void 0 : _a.content.toLowerCase()) ===
                            this.wizard.configs.commands.quit) {
                            wizardNode.delete();
                            this.wizard.message.channel.send(this.wizard.configs.responses.quit);
                            return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                        }
                        if (this.options.skipValue) {
                            if (((_b = response.first()) === null || _b === void 0 ? void 0 : _b.content.toLowerCase()) ===
                                this.wizard.configs.commands.skip) {
                                wizardNode.delete();
                                return {
                                    status: WizardNodeResponseStatus.COMPLETE,
                                    item: this.options.skipValue,
                                };
                            }
                        }
                        if (((_c = response.first()) === null || _c === void 0 ? void 0 : _c.content.toLowerCase()) ===
                            this.wizard.configs.commands.doneLoop) {
                            res = (_d = response.first()) === null || _d === void 0 ? void 0 : _d.content;
                            wizardNode.delete();
                            break;
                        }
                        var res = yield this.validationCB(response.first());
                        wizardNode.delete();
                        failed = !res;
                        details.color = defaultColor ? defaultColor : "NOT_QUITE_BLACK";
                    } while (!res);
                    if (res !== this.wizard.configs.commands.doneLoop) {
                        item.push(res);
                        const cbResult = yield this.options.loopedCB(item);
                        if (cbResult) {
                            if (cbResult.item)
                                item = cbResult.item;
                            if (cbResult.message)
                                this.wizard.message.channel.send(cbResult.message);
                        }
                    }
                    failed = false;
                } while (!res || res != this.wizard.configs.commands.doneLoop);
                return { status: WizardNodeResponseStatus.COMPLETE, item };
            }
            else {
                let attempted = false;
                let item;
                do {
                    if (attempted) {
                        details.color = "RED";
                        if (this.options.invalidMessage)
                            this.wizard.message.channel.send(this.options.invalidMessage);
                    }
                    let embed = new discord_js_1.MessageEmbed(details);
                    var wizardNode = yield this.wizard.message.channel.send({ embed });
                    try {
                        var response = yield this.wizard.message.channel.awaitMessages((m) => m.author.id === this.wizard.message.author.id, { max: 1, time: this.timer * 1000, errors: ["time"] });
                    }
                    catch (err) {
                        this.wizard.message.channel.send(this.wizard.configs.responses.time.replace(StringReplacements.TIME, this.timer.toString()));
                        return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                    }
                    if (((_e = response.first()) === null || _e === void 0 ? void 0 : _e.content.toLowerCase()) ===
                        this.wizard.configs.commands.quit) {
                        wizardNode.delete();
                        this.wizard.message.channel.send(this.wizard.configs.responses.quit);
                        return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                    }
                    if (this.options.skipValue) {
                        if (((_f = response.first()) === null || _f === void 0 ? void 0 : _f.content.toLowerCase()) ===
                            this.wizard.configs.commands.skip) {
                            wizardNode.delete();
                            return {
                                status: WizardNodeResponseStatus.COMPLETE,
                                item: this.options.skipValue,
                            };
                        }
                    }
                    item = yield this.validationCB(response.first());
                    wizardNode.delete();
                    attempted = true;
                } while (!item);
                return { status: WizardNodeResponseStatus.COMPLETE, item };
            }
        });
    }
}
exports.WizardNode = WizardNode;
class CustomWizardNode extends WizardNode {
    constructor(wizard, overwrites, callback, options) {
        super(wizard, overwrites, options);
        this.callback = callback;
    }
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = this.callback(response);
            if (res)
                return res;
        });
    }
}
exports.CustomWizardNode = CustomWizardNode;
class EmojiWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const emojiRegEx = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
            const matches = response.content.match(emojiRegEx);
            if (matches && matches.length > 0)
                return matches;
        });
    }
}
exports.EmojiWizardNode = EmojiWizardNode;
class TextWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof response.content === "string")
                return response.content;
        });
    }
}
exports.TextWizardNode = TextWizardNode;
class ColorWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (checker_1.default.isHexColor(response.content))
                return response.content;
        });
    }
}
exports.ColorWizardNode = ColorWizardNode;
class GraphicWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const isMedia = yield checker_1.default.isMediaURL(response.content.toString());
            if (isMedia)
                return response.content;
        });
    }
}
exports.GraphicWizardNode = GraphicWizardNode;
class UserMentionWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.mentions.users.array().length > 0)
                return response.mentions.users.first();
        });
    }
}
exports.UserMentionWizardNode = UserMentionWizardNode;
class ChannelMentionWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.mentions.channels.array().length > 0)
                return response.mentions.channels.first();
        });
    }
}
exports.ChannelMentionWizardNode = ChannelMentionWizardNode;
class RoleMentionWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.mentions.roles.array().length > 0)
                return response.mentions.roles.first();
        });
    }
}
exports.RoleMentionWizardNode = RoleMentionWizardNode;
class OptionsWizardNode extends WizardNode {
    constructor(wizard, overwrites, choices, strict, options) {
        super(wizard, overwrites, options);
        this.strict = strict !== null && strict !== void 0 ? strict : true;
        this.choices = choices;
        this.numList = [];
    }
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () {
            let optionList = "\n";
            for (let i = 0; i < this.choices.length; i++) {
                optionList += `\`${i + 1}\` | ${this.choices[i]}\n`;
                this.numList.push(i + 1);
            }
            details.description
                ? (details.description += optionList)
                : (details.description = optionList);
            return details;
        });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const choice = parseInt(response.content);
            if (this.numList.includes(choice))
                return { value: choice - 1, isOption: true };
            if (!this.strict)
                return { value: response.content, isOption: false };
        });
    }
}
exports.OptionsWizardNode = OptionsWizardNode;
class ConfirmationWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () {
            details.footer = {
                text: "Enter 'confirm' to proceed. Enter 'quit' to end wizard.",
            };
            return details;
        });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof response.content == "string" &&
                response.content.toLowerCase() == "confirm")
                return true;
        });
    }
}
exports.ConfirmationWizardNode = ConfirmationWizardNode;
class YesNoWizardNode extends WizardNode {
    preSendCB(details) {
        return __awaiter(this, void 0, void 0, function* () {
            details.footer = {
                text: "Enter 'yes' or 'no' to proceed. Enter 'quit' to end wizard.",
            };
            return details;
        });
    }
    validationCB(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof response.content == "string") {
                if (response.content.toLowerCase() == "yes")
                    return true;
                if (response.content.toLowerCase() == "no")
                    return false;
            }
        });
    }
}
exports.YesNoWizardNode = YesNoWizardNode;
