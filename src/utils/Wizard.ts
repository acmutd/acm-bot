import { MessageEmbedOptions, Message, MessageEmbed, Collection } from "discord.js";
import { keys } from 'ts-transformer-keys';
import CheckerUtils from "./Color";

enum StringReplacements {
    TIME = '<time>'
}

export interface WizardConfigurations {
    commands: {
        quit: string,
        skip: string,
        doneLoop: string
    },
    responses: {
        quit: string,
        skip: string,
        doneLoop: string,
        time: string,
        error: string
    }
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
                doneLoop: 'done'
            },
            responses: {
                quit: 'You have quit the wizard',
                skip: '',
                doneLoop: 'You have ended the loop',
                time: '⏰ You ran out of time (<time> seconds). Ending wizard...',
                error: 'There was an issue with the setup wizard.'
            }
        }
    }

    addNode(node: WizardNode) { this.nodes.push(node); }

    async start() {}
}


enum WizardNodeResponseStatus {
    COMPLETE, INCOMPLETE
}

export interface WizardNodeOptions {
    timer?: number,
    skip?: {
        skippable: boolean,
        skipValue: any
    },
    invalidMessage?: string,
    looped?: boolean
}

export interface WizardNodeResponse {
    status: WizardNodeResponseStatus,
    item: any
}

export abstract class WizardNode {

    public wizard: Wizard;
    public overwrites: MessageEmbedOptions;
    public options: WizardNodeOptions;
    
    public looped: boolean;
    public timer: number;

    constructor(wizard: Wizard, overwrites: MessageEmbedOptions, options?: WizardNodeOptions) {
        this.wizard = wizard;
        this.options = options || { timer: 20, looped: false };
        this.timer = options?.timer || 20;
        this.looped = options?.looped || false;
        this.overwrites = overwrites;
    }

    private implementDefaults(overwrites: MessageEmbedOptions): MessageEmbedOptions {
        let details = overwrites;
        // 1. Replace the defaults where there are overwrites
        if(this.wizard.defaults) {
            details = this.wizard.defaults;
            keys<MessageEmbedOptions>().forEach(key => {
                if(this.overwrites[key] && details[key]) 
                details[key] = this.overwrites[key] as any;
            });
        }
        // 2. Add any additions in front of options
        if(this.wizard.additions) {
            let additions = this.wizard.additions;
            keys<MessageEmbedOptions>().forEach(key => {
                if(typeof additions[key] === 'string' && typeof details[key] === 'string') {
                    details[key] = (additions[key] as string + details[key]) as any;
                }
            });
        }

        return details;
    }

    abstract async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions | void>;
    
    abstract async validationCB(response: Message): Promise<any>;

    async emit() {
        
        let attempted = false;
        let details = this.implementDefaults(this.overwrites);

        // pre-send cb
        try {
            let cb = await this.preSendCB(details);
            if(cb) details = cb;
        } catch (err) { 
            // logger
        }
        do {
            // if attempted then send the error message, if there is one
            if(attempted && this.options.invalidMessage) {
                this.wizard.message.channel.send(this.options.invalidMessage);
            }

            let embed = new MessageEmbed(details);
            var wizardNode = await this.wizard.message.channel.send({embed});
            try {
                var response = await this.wizard.message.channel.awaitMessages(m => m.author.id === this.wizard.message.author.id, {max: 1, time: this.timer*1000, errors: ['time']})
            } catch(err) {
                this.wizard.message.channel.send(this.wizard.configs.responses.time.replace(StringReplacements.TIME, this.timer.toString()));
                return { status: WizardNodeResponseStatus.INCOMPLETE, item: false };
            }
            
            if(response.first()?.content.toLowerCase() === this.wizard.configs.commands.quit) { wizardNode.delete(); this.wizard.message.channel.send(this.wizard.configs.responses.quit); return false; }
        
            if(this.options.skip) {
                if(response.first()?.content.toLowerCase() === this.wizard.configs.commands.skip) { wizardNode.delete(); return this.options.skip.skipValue; }
            }

            // condition should return what it wants
            var item = await this.validationCB(response.first()!);
    
            attempted = true;
    
        } while (!item)

        wizardNode.delete();
        return { status: WizardNodeResponseStatus.COMPLETE, item };
    }
}

export class TextWizardNode extends WizardNode {

    async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions | void> {}

    async validationCB(response: Message): Promise<any> {
        if(typeof response.content == 'string') {
            return response.content;
        }
    }
}

export class ColorWizardNode extends WizardNode {

    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        if(CheckerUtils.color.isHexColor(response.content)) {
            return response.content;
        }
    }
}

//! add support for actual images
export class GraphicWizardNode extends WizardNode {

    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        var isMedia = await CheckerUtils.isMediaURL(response.content.toString())
        if(isMedia) {
            return response.content;
        }
    }
}

export class UserMentionWizardNode extends WizardNode{

    async preSendCB(details: MessageEmbedOptions) {}

    async validationCB(response: Message) {
        throw new Error("Method not implemented.");
    }

}