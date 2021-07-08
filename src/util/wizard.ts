import { Timestamp } from "bson";
import { MessageEmbedOptions, Message, MessageEmbed } from "discord.js";
import CheckerUtils from "./checker";

enum StringReplacements {
  TIME = "<time>",
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

  constructor(
    message: Message,
    defaults?: MessageEmbedOptions,
    additions?: MessageEmbedOptions
  ) {
    this.message = message;
    this.defaults = defaults;
    this.additions = additions;
    this.configs = this.setConfigs();
  }

  private setConfigs(): WizardConfigurations {
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

  public addNode(node: WizardNode): void {
    this.nodes.push(node);
  }
  public addNodes(nodes: WizardNode[]): void {
    this.nodes.push(...nodes);
  }

  public async start(): Promise<any[] | false> {
    const responses: any[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const response = await node.emit();
      if (response.status === WizardNodeResponseStatus.INCOMPLETE) return false;
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
  skipValue?: any;
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

export abstract class WizardNode {
  public wizard: Wizard;
  public overwrites: MessageEmbedOptions;
  public options: WizardNodeOptions;
  public timer: number;

  constructor(
    wizard: Wizard,
    overwrites: MessageEmbedOptions,
    options?: WizardNodeOptions
  ) {
    this.wizard = wizard;
    this.options = options || { timer: 20 };
    this.timer = options?.timer || 20;
    this.overwrites = overwrites;
  }

  private implementDefaults(
    overwrites: MessageEmbedOptions
  ): MessageEmbedOptions {
    let details = overwrites;
    if (this.wizard.defaults) {
      details = this.wizard.defaults;
      messageEmbedOptionKeys.forEach((key) => {
        if (this.overwrites[key] && details[key])
          details[key] = this.overwrites[key] as any;
      });
    }
    if (this.wizard.additions) {
      const additions = this.wizard.additions;
      messageEmbedOptionKeys.forEach((key) => {
        if (
          typeof additions[key] === "string" &&
          typeof details[key] === "string"
        )
          details[key] = ((additions[key] as string) + details[key]) as any;
      });
    }
    return details;
  }

  public abstract preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void>;
  public abstract validationCB(response: Message): Promise<any>;

  public async emit(): Promise<WizardNodeResponse> {
    let details = this.implementDefaults(this.overwrites);
    if (!details.footer) {
      details.footer = {
        text: `${
          this.options.loopedCB
            ? "Enter '" +
              this.wizard.configs.commands.doneLoop +
              "' when you're finished. "
            : ""
        }Enter '${this.wizard.configs.commands.quit}' to end the wizard...`,
      };
    }
    try {
      const cb = await this.preSendCB(details);
      if (cb) details = cb;
    } catch (err) {
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
          let embed = new MessageEmbed(details);
          var wizardNode = await this.wizard.message.channel.send({ embed });
          try {
            var response = await this.wizard.message.channel.awaitMessages(
              (m) => m.author.id === this.wizard.message.author.id,
              { max: 1, time: this.timer * 1000, errors: ["time"] }
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
            this.wizard.message.channel.send(
              this.wizard.configs.responses.quit
            );
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
          var res = await this.validationCB(response.first()!);
          wizardNode.delete();
          failed = !res;
          details.color = defaultColor ? defaultColor : "NOT_QUITE_BLACK";
        } while (!res);
        if (res !== this.wizard.configs.commands.doneLoop) {
          item.push(res);
          const cbResult: WizardNodeLoopCBResponse =
            await this.options.loopedCB(item);
          if (cbResult) {
            if (cbResult.item) item = cbResult.item;
            if (cbResult.message)
              this.wizard.message.channel.send(cbResult.message);
          }
        }
        failed = false;
      } while (!res || res != this.wizard.configs.commands.doneLoop);
      return { status: WizardNodeResponseStatus.COMPLETE, item };
    } else {
      let attempted = false;
      let item;

      do {
        if (attempted) {
          details.color = "RED";
          if (this.options.invalidMessage)
            this.wizard.message.channel.send(this.options.invalidMessage);
        }
        let embed = new MessageEmbed(details);
        var wizardNode = await this.wizard.message.channel.send({ embed });
        try {
          var response = await this.wizard.message.channel.awaitMessages(
            (m) => m.author.id === this.wizard.message.author.id,
            { max: 1, time: this.timer * 1000, errors: ["time"] }
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
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}
  public async validationCB(response: Message): Promise<any> {
    const res = this.callback(response);
    if (res) return res;
  }
}
export class EmojiWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}
  public async validationCB(response: Message): Promise<any> {
    const emojiRegEx =
      /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
    const matches = response.content.match(emojiRegEx);
    if (matches && matches.length > 0) return matches;
  }
}
export class TextWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}

  public async validationCB(response: Message): Promise<any> {
    if (typeof response.content === "string") return response.content;
  }
}
export class ColorWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}

  public async validationCB(response: Message): Promise<string | void> {
    if (CheckerUtils.isHexColor(response.content)) return response.content;
  }
}
export class GraphicWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}
  public async validationCB(response: Message): Promise<string | void> {
    const isMedia = await CheckerUtils.isMediaURL(response.content.toString());
    if (isMedia) return response.content;
  }
}
export class UserMentionWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}

  public async validationCB(response: Message): Promise<any> {
    if (response.mentions.users.array().length > 0)
      return response.mentions.users.first();
  }
}
export class ChannelMentionWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}

  public async validationCB(response: Message): Promise<any> {
    if (response.mentions.channels.array().length > 0)
      return response.mentions.channels.first();
  }
}
export class RoleMentionWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions | void> {}

  public async validationCB(response: Message): Promise<any> {
    if (response.mentions.roles.array().length > 0)
      return response.mentions.roles.first();
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
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions> {
    let optionList = "\n";
    for (let i = 0; i < this.choices.length; i++) {
      optionList += `\`${i + 1}\` | ${this.choices[i]}\n`;
      this.numList.push(i + 1);
    }
    details.description
      ? (details.description += optionList)
      : (details.description = optionList);
    return details;
  }

  public async validationCB(
    response: Message
  ): Promise<{ value: number | string; isOption: boolean } | undefined> {
    const choice = parseInt(response.content);
    if (this.numList.includes(choice))
      return { value: choice - 1, isOption: true };
    if (!this.strict) return { value: response.content, isOption: false };
  }
}
export class ConfirmationWizardNode extends WizardNode {
  public async preSendCB(
    details: MessageEmbedOptions
  ): Promise<MessageEmbedOptions> {
    details.footer = {
      text: "Enter 'confirm' to proceed. Enter 'quit' to end wizard.",
    };
    return details;
  }
  public async validationCB(response: Message): Promise<boolean | void> {
    if (
      typeof response.content == "string" &&
      response.content.toLowerCase() == "confirm"
    )
      return true;
  }
}
export class YesNoWizardNode extends WizardNode {
  async preSendCB(details: MessageEmbedOptions): Promise<MessageEmbedOptions> {
    details.footer = {
      text: "Enter 'yes' or 'no' to proceed. Enter 'quit' to end wizard.",
    };
    return details;
  }
  async validationCB(response: Message): Promise<boolean | void> {
    if (typeof response.content == "string") {
      if (response.content.toLowerCase() == "yes") return true;
      if (response.content.toLowerCase() == "no") return false;
    }
  }
}
