import {
  ApplicationCommandPermissionData,
  ButtonInteraction,
  Interaction,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import CustomInteraction, {
  InteractionConfig,
  InteractionContext,
} from "./interaction";

export interface ButtonInteractionConfig extends InteractionConfig {}

export interface ButtonInteractionContext extends InteractionContext {
  interaction: ButtonInteraction;
}

/**
 * Buttons are sent out as part of messages, so there is no need to register them.
 * However, we do need a way to handle the callbacks
 */
export default abstract class CustomButtonInteraction extends CustomInteraction {
  protected constructor(config: ButtonInteractionConfig) {
    super(config);
  }

  /**
   * Match to customId, either by direct comparison or regex or something else.
   * If it matches, expect handleInteraction to be called afterwards.
   * @param customId
   */
  public abstract matchCustomId(customId: string);

  /**
   * Perform actions for handling the interaction
   */
  public abstract handleInteraction(context: ButtonInteractionContext);
}
