import Bot from "./bot";
import { Interaction } from "discord.js";

export interface InteractionContext {
  bot: Bot;
  interaction: Interaction;
}

export interface InteractionConfig {
  name: string;
}

export default abstract class BaseInteraction {
  public readonly name: string;

  protected constructor(config: InteractionConfig) {
    this.name = config.name;
  }

  public abstract handleInteraction(context: InteractionContext): Promise<void>;
}
