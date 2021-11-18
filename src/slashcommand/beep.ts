import SlashCommand from "../api/slashcommand";

export default class BeepCommand extends SlashCommand {
  public constructor() {
    super({
      name: "beep",
      description: "Beep boop I'm a bot",
    });
  }
}
