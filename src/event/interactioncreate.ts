import Event from "../api/event";
import Bot from "../api/bot";
import { Interaction, Message } from "discord.js";

export default class InteractionCreateEvent extends Event {
  constructor(bot: Bot) {
    super(bot, "interactionCreate");
  }

  public async emit(bot: Bot, interaction: Interaction): Promise<void> {
    await bot.managers.interaction.handle(interaction);
  }
}
