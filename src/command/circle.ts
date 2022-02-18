import Command, { CommandContext } from "../api/command";
import Bot from "../api/bot";
import { CategoryChannel, Message, OverwriteResolvable } from "discord.js";
import Wizard, {
  ColorWizardNode,
  EmojiWizardNode,
  GraphicWizardNode,
  TextWizardNode,
  UserMentionWizardNode,
} from "../util/wizard";
import { settings } from "../settings";
import { CircleData } from "../api/schema";

export default class CircleCommand extends Command {
  constructor() {
    super({
      name: "circle",
      description: "A suite of command that manage ACM Community Circles...",
      dmWorks: false,
      userPermissions: BigInt(268443664),
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    switch (args[0]) {
      case "add":
        await addCircle(bot, msg, args);
        break;
      case "repost":
        await bot.managers.circle.repost();
        break;
      default:
        msg.channel.send(
          `User '${settings.prefix}circle help' to show a list of commands...`
        );
        break;
    }
  }
}

async function addCircle(bot: Bot, msg: Message, args: string[]) {
  const wizard = new Wizard(msg, undefined, {
    title: "__**Circle Creation**__ ",
  });
  wizard.addNodes([
    new UserMentionWizardNode(wizard, {
      title: "Owner",
      description: `Who's the owner of the circle? (mention them)`,
    }),
    new TextWizardNode(wizard, {
      title: "Name",
      description: `What's the circle name?`,
    }),
    new TextWizardNode(wizard, {
      title: "Description",
      description: `What's the circle description?`,
    }),
    new ColorWizardNode(wizard, {
      title: "Color",
      description: `What's the circle color? (used for the embed & role)`,
    }),
    new EmojiWizardNode(wizard, {
      title: "Emoji",
      description: `What's the circle's emoji?`,
    }),
    new GraphicWizardNode(wizard, {
      title: "Image",
      description: `What's the circle's graphic/image? (url)`,
    }),
  ]);
  const res = await wizard.start();
  if (res === false) return;
  const circle: CircleData = {
    name: res[1],
    description: res[2],
    emoji: res[4][0],
    imageUrl: res[5],
    createdOn: new Date(),
    owner: res[0].id,
  };
  try {
    var owner = await msg.guild!.members.fetch(res[0].id);
  } catch (err) {
    bot.response.emit(
      msg.channel,
      `Could not find member in the guild...`,
      "error"
    );
    return;
  }
  const circleRole = await msg.guild!.roles.create({
    name: `${circle.emoji} ${circle.name}`,
    mentionable: true,
    color: res[3],
  });
  await owner.roles.add(circleRole);
  const permissions: OverwriteResolvable[] = [
    {
      id: msg.guild!.id,
      deny: ["VIEW_CHANNEL"],
      type: "role",
    },
    {
      id: circleRole,
      allow: ["VIEW_CHANNEL"],
      type: "role",
    },
  ];
  const circleCategory = (await msg.guild!.channels.fetch(settings.circles.parentCategory)) as CategoryChannel;
  const desc = `🎗️: ${circleRole.name}`;
  const circleChannel = await msg.guild!.channels.create(
    `${circle.emoji} ${circle.name}`,
    {
      type: "GUILD_TEXT",
      topic: desc,
      parent: circleCategory,
      permissionOverwrites: permissions,
    }
  );
  circle["_id"] = circleRole.id;
  circle.channel = circleChannel.id;
  circle.owner = owner.id;
  const added = await bot.managers.database.circleAdd(circle);
  if (!added) {
    bot.response.emit(
      msg.channel,
      `Could not add circle to the database...`,
      "error"
    );
    await circleRole.delete();
    await circleChannel.delete();
    return;
  }

  bot.response.emit(
    msg.channel,
    `Successfully created circle <@&${circleRole.id}>...`,
    "success"
  );
}
