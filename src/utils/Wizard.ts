import { MessageEmbedOptions, Message, MessageEmbed } from 'discord.js';
import CheckerUtils from './Color';

enum StringReplacements {
    TIME = '<time>',
}

export interface WizardConfigurations {
    commands: {
        quit: string;
        skip: string;
        doneLoop: string;
    };
    responses: {
        quit: string;
        skip: string;
        doneLoop: string;
        time: string;
        error: string;
    };
}

export default class Wizard {
    public nodes: WizardNode[] = [];
    public message: Message;
    public defaults: MessageEmbedOptions | undefined;
    public additions: MessageEmbedOptions | undefined;
    public configs: WizardConfigurations;

    constructor(message: Message, defaults?: MessageEmbedOptions, additions?: MessageEmbedOptions) {
        this.message = message;
        this.defaults = defaults;
        this.additions = additions;
        this.configs = this.setConfigurations();
    }

    private setConfigurations(): WizardConfigurations {
        return {
            commands: {
                quit: 'quit',
                skip: 'skip',
                doneLoop: 'done',
            },
            responses: {
                quit: 'You have quit the wizard',
                skip: '',
                doneLoop: 'You have ended the loop',
                time: '⏰ You ran out of time (+<time> seconds). Ending wizard...',
                error: 'There was an issue with the setup wizard.',
            },
        };
    }

    addNode(node: WizardNode) {
        this.nodes.push(node);
    }

    addNodes(nodes: WizardNode[]) {
        this.nodes.push(...nodes);
    }

    async start(): Promise<any[] | false> {
        let responses: any[] = [];
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const response = await node.emit();
            if (response.status == WizardNodeResponseStatus.INCOMPLETE) return false;
            responses.push(response.item);
        }
        return responses;
    }
}

enum WizardNodeResponseStatus {
    COMPLETE,
    INCOMPLETE,
}

export interface WizardNodeOptions {
    timer?: number;
    invalidMessage?: string | MessageEmbed;
    /**
     * Providing a skip value will give users the option to skip this node
     */
    skipValue?: any;
    /**
     * Providing a loopedCB value will turn the node into a looped node
     */
    loopedCB?: (item: any[]) => WizardNodeLoopCBResponse;
}

export interface WizardNodeResponse {
    status: WizardNodeResponseStatus;
    item: any;
}

export interface WizardNodeLoopCBResponse {
    item?: any[] | undefined;
    message?: string | MessageEmbed | undefined;
}

const messageEmbedOptionKeys: (keyof MessageEmbedOptions)[] = [
    'title',
    'description',
    'url',
    'timestamp',
    'color',
    'fields',
    'files',
    'author',
    'thumbnail',
    'image',
    'video',
    'footer',
];

export abstract class WizardNode {
    public wizard: Wizard;
    public overwrites: MessageEmbedOptions;
    public options: WizardNodeOptions;
    public timer: number;

    constructor(wizard: Wizard, overwrites: MessageEmbedOptions, options?: WizardNodeOptions) {
        this.wizard = wizard;
        this.options = options || { timer: 20 };
        this.timer = options?.timer || 20;
        this.overwrites = overwrites;
    }

    private implementDefaults(overwrites: MessageEmbedOptions): MessageEmbedOptions {
        let details = overwrites;
        // 1. Replace the defaults where there are overwrites
        if (this.wizard.defaults) {
            details = this.wizard.defaults;
            messageEmbedOptionKeys.forEach((key) => {
                if (this.overwrites[key] && details[key])
                    details[key] = this.overwrites[key] as any;
            });
        }
        // 2. Add any additions in front of options
        if (this.wizard.additions) {
            let additions = this.wizard.additions;
            messageEmbedOptionKeys.forEach((key) => {
                if (typeof additions[key] === 'string' && typeof details[key] === 'string') {
                    details[key] = ((additions[key] as string) + details[key]) as any;
                }
            });
        }

        return details;
    }

    abstract async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions | void>;
    abstract async validationCB(response: Message): Promise<any>;

    async emit(): Promise<WizardNodeResponse> {
        let details = this.implementDefaults(this.overwrites);
        if (!details.footer)
            details.footer = {
                text: `${
                    this.options.loopedCB
                        ? "Enter '" +
                          this.wizard.configs.commands.doneLoop +
                          "' when you're finished. "
                        : ''
                }Enter '${this.wizard.configs.commands.quit}' to end wizard.`,
            };

        // pre-send cb
        try {
            let cb = await this.preSendCB(details);
            if (cb) details = cb;
        } catch (err) {
            // logger
            console.log(err);
        }
        if (this.options.loopedCB) {
            let item = [];
            let failed = false;
            let defaultColor = details.color;
            do {
                do {
                    // if attempted then send the error message, if there is one
                    if (failed) {
                        // turn next message red
                        details.color = 'RED';
                        if (this.options.invalidMessage) {
                            this.wizard.message.channel.send(this.options.invalidMessage);
                        }
                    }

                    let embed = new MessageEmbed(details);
                    var wizardNode = await this.wizard.message.channel.send({ embed });
                    try {
                        var response = await this.wizard.message.channel.awaitMessages(
                            (m) => m.author.id === this.wizard.message.author.id,
                            { max: 1, time: this.timer * 1000, errors: ['time'] }
                        );
                    } catch (err) {
                        this.wizard.message.channel.send(
                            this.wizard.configs.responses.time.replace(
                                StringReplacements.TIME,
                                this.timer.toString()
                            )
                        );
                        return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                    }

                    if (
                        response.first()?.content.toLowerCase() ===
                        this.wizard.configs.commands.quit
                    ) {
                        wizardNode.delete();
                        this.wizard.message.channel.send(this.wizard.configs.responses.quit);
                        return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                    }

                    if (this.options.skipValue) {
                        if (
                            response.first()?.content.toLowerCase() ===
                            this.wizard.configs.commands.skip
                        ) {
                            wizardNode.delete();
                            return {
                                status: WizardNodeResponseStatus.COMPLETE,
                                item: this.options.skipValue,
                            };
                        }
                    }
                    if (
                        response.first()?.content.toLowerCase() ===
                        this.wizard.configs.commands.doneLoop
                    ) {
                        res = response.first()?.content;
                        wizardNode.delete();
                        break;
                    }

                    // condition should return what it wants
                    var res = await this.validationCB(response.first()!);
                    wizardNode.delete();
                    failed = !res;
                    details.color = defaultColor ? defaultColor : 'NOT_QUITE_BLACK';
                } while (!res);
                if (res != this.wizard.configs.commands.doneLoop) {
                    item.push(res);
                    const cbResult: WizardNodeLoopCBResponse = await this.options.loopedCB(item);
                    if (cbResult) {
                        if (cbResult.item) item = cbResult.item;
                        if (cbResult.message) this.wizard.message.channel.send(cbResult.message);
                    }
                }
                failed = false;
            } while (!res || res != this.wizard.configs.commands.doneLoop);
            return { status: WizardNodeResponseStatus.COMPLETE, item };
        } else {
            let attempted = false;
            let item;

            do {
                // if attempted then send the error message, if there is one
                if (attempted) {
                    // turn next message red
                    details.color = 'RED';
                    if (this.options.invalidMessage) {
                        this.wizard.message.channel.send(this.options.invalidMessage);
                    }
                }

                let embed = new MessageEmbed(details);
                var wizardNode = await this.wizard.message.channel.send({ embed });
                try {
                    var response = await this.wizard.message.channel.awaitMessages(
                        (m) => m.author.id === this.wizard.message.author.id,
                        { max: 1, time: this.timer * 1000, errors: ['time'] }
                    );
                } catch (err) {
                    this.wizard.message.channel.send(
                        this.wizard.configs.responses.time.replace(
                            StringReplacements.TIME,
                            this.timer.toString()
                        )
                    );
                    return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                }

                if (response.first()?.content.toLowerCase() === this.wizard.configs.commands.quit) {
                    wizardNode.delete();
                    this.wizard.message.channel.send(this.wizard.configs.responses.quit);
                    return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
                }

                if (this.options.skipValue) {
                    if (
                        response.first()?.content.toLowerCase() ===
                        this.wizard.configs.commands.skip
                    ) {
                        wizardNode.delete();
                        return {
                            status: WizardNodeResponseStatus.COMPLETE,
                            item: this.options.skipValue,
                        };
                    }
                }

                // condition should return what it wants
                item = await this.validationCB(response.first()!);
                wizardNode.delete();
                attempted = true;
            } while (!item);
            return { status: WizardNodeResponseStatus.COMPLETE, item };
        }
    }
}

export class CustomWizardNode extends WizardNode {
    public callback: Function;
    constructor(
        wizard: Wizard,
        overwrites: MessageEmbedOptions,
        callback: (arg0: Message) => any,
        options?: WizardNodeOptions
    ) {
        super(wizard, overwrites, options);
        this.callback = callback;
    }
    async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions | void> {}

    async validationCB(response: Message): Promise<any> {
        let res = this.callback(response);
        if (res) return res;
    }
}

export class TextWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions | void> {}

    async validationCB(response: Message): Promise<any> {
        if (typeof response.content == 'string') {
            return response.content;
        }
    }
}

export class ColorWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        if (CheckerUtils.isHexColor(response.content)) {
            return response.content;
        }
    }
}

// TODO: add support for actual images
export class GraphicWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        var isMedia = await CheckerUtils.isMediaURL(response.content.toString());
        if (isMedia) {
            return response.content;
        }
    }
}

export class UserMentionWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        if (response.mentions.users.array().length > 0) {
            return response.mentions.users.first();
        }
    }
}

export class ChannelMentionWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        if (response.mentions.channels.array().length > 0) {
            return response.mentions.channels.first();
        }
    }
}

export class RoleMentionWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        if (response.mentions.roles.array().length > 0) {
            return response.mentions.roles.first();
        }
    }
}

export class OptionsWizardNode extends WizardNode {
    public choices: string[];
    public strict: boolean;
    public numList: number[];
    constructor(
        wizard: Wizard,
        overwrites: MessageEmbedOptions,
        choices: string[],
        strict?: boolean,
        options?: WizardNodeOptions
    ) {
        super(wizard, overwrites, options);
        this.strict = strict ?? true;
        this.choices = choices;
        this.numList = [];
    }
    async preSendCB(details: MessageEmbedOptions) {
        var optionList = '\n';
        for (let i = 0; i < this.choices.length; i++) {
            optionList += `\`${i + 1}\` | ${this.choices[i]}\n`;
            this.numList.push(i + 1);
        }
        details.description
            ? (details.description += optionList)
            : (details.description = optionList);
        return details;
    }

    async validationCB(
        response: Message
    ): Promise<{ value: number | string; isOption: boolean } | undefined> {
        var choice = parseInt(response.content);
        if (this.numList.includes(choice)) return { value: choice - 1, isOption: true };
        if (!this.strict) return { value: response.content, isOption: false };
    }
}

export class ConfirmationWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {
        details.footer = { text: "Enter 'confirm' to proceed. Enter 'quit' to end wizard." };
        return details;
    }
    async validationCB(response: Message) {
        if (typeof response.content == 'string' && response.content.toLowerCase() == 'confirm') {
            return true;
        }
    }
}

/**
 * This node returns a boolean
 */
export class YesNoWizardNode extends WizardNode {
    async preSendCB(details: MessageEmbedOptions) {
        details.footer = { text: "Enter 'yes' or 'no' to proceed. Enter 'quit' to end wizard." };
        return details;
    }
    async validationCB(response: Message) {
        if (typeof response.content == 'string') {
            if (response.content.toLowerCase() == 'yes') return true;
            if (response.content.toLowerCase() == 'no') return false;
        }
    }
}
