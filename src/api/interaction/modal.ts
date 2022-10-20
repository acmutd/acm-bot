import {
  ApplicationCommandPermissionData,
  ModalSubmitInteraction,
  Interaction,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import CustomInteraction, {
  InteractionConfig,
  InteractionContext,
} from "./interaction";

export interface ModalInteractionConfig extends InteractionConfig {}

export interface ModalInteractionContext extends InteractionContext {
  interaction: ModalSubmitInteraction;
}

/**
 * No need to register modals, but we do need a way to handle the callbacks
 */
export default abstract class CustomModalInteraction extends CustomInteraction {
  protected constructor(config: ModalInteractionConfig) {
    super(config);
  }

  /**
   * Match to customId, either by direct comparison or regex or something else.
   * If it matches, expect handleInteraction to be called afterwards.
   * @param customId
   */
  public abstract matchCustomId(customId: string): boolean;

  /**
   * Perform actions for handling the interaction
   */
  public abstract handleInteraction(context: ModalInteractionContext): any;
}
