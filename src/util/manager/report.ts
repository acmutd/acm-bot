import Manager from "../../api/manager";
import Bot from "../../api/bot";
import {
  ButtonInteraction,
  ContextMenuInteraction,
  Interaction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageContextMenuInteraction,
  MessageEmbed,
} from "discord.js";
import { v4 } from "uuid";
import assert from "assert";

interface Report {
  message: Message;
  originalInteraction: ContextMenuInteraction;
}

/**
 * Anonymous report system logic
 */
export default class ReportManager extends Manager {
  // TODO: If select "Other" provide modal prompt for more custom feedback
  // IMPORTANT: NO MORE THAN 5 BUTTONS/ROW, WHICH MEANS ONLY UP TO 5 CATEGORIES
  private readonly reportCategories = [
    // Container for holding in-progress reports
    "Offensive",
    "Spam & Ads",
    "Illegal or NSFW",
    "Uncomfortable",
    "Other",
  ];

  private reports = new Map<string, Report>();

  constructor(bot: Bot) {
    super(bot);
  }

  public init(): void {}

  public async handleInitialReport(interaction: MessageContextMenuInteraction) {
    // Immediately fetch message
    const message = await interaction.channel.messages.fetch(
      interaction.targetMessage.id
    );

    // Generate a report ID
    const reportId = v4().toString();

    // Add report to the collection
    this.reports.set(reportId, {
      message,
      originalInteraction: interaction,
    });

    // Prompt for report category.
    const actionRow = new MessageActionRow({
      components: this.reportCategories.map(
        (cat) =>
          new MessageButton({
            label: cat,
            customId: `report/${reportId}/${cat}`,
            style: "PRIMARY",
          })
      ),
    });

    const content = `[Link to message](${message.url})`;

    const embed = new MessageEmbed({
      title: `Anonymous Report ${reportId}`,
      description: `Please select a category from the buttons below.`,
    });

    await interaction.reply({
      content,
      embeds: [embed],
      components: [actionRow],
      ephemeral: true,
    });
  }

  public async handleCategorySelection(interaction: ButtonInteraction) {
    // Parse report information
    const match = interaction.customId.match(/report\/([^\/]*)\/([^\/]+)/);
    const reportId = match[1];
    const category = match[2];

    // Fetch report from storage
    let report = this.reports.get(reportId);
    if (!report) {
      await interaction.reply({
        content:
          "It looks like you're trying to respond to a previous interaction.",
        ephemeral: true,
      });
    }
    this.reports.delete(reportId);
    const { message, originalInteraction } = report;

    // Build report to send out
    const reportContent =
      `**Report ${reportId}**\n` +
      `Category: *${category}*\n` +
      `In case the user changes names, here is a mention: <@${message.author.id}>`;

    const embed = new MessageEmbed({
      author: {
        name: `${message.member.displayName} (${message.author.username}#${message.author.discriminator})`,
        iconURL: message.member.displayAvatarURL(),
      },
      title: "link to message",
      url: message.url,
      description: message.content,
      timestamp: message.createdTimestamp,
    });

    const modChannel = await this.bot.channels.fetch(
      this.bot.settings.channels.mod
    );
    assert.ok(modChannel.isText());

    // Send report
    modChannel.send({
      content: reportContent,
      embeds: [embed],
      allowedMentions: { users: [] },
    });

    // Remove buttons
    await originalInteraction.editReply({
      components: [
        new MessageActionRow({
          components: this.reportCategories.map(
            (cat) =>
              new MessageButton({
                label: cat,
                customId: `report/${reportId}/${cat}`,
                style: "PRIMARY",
                disabled: true,
              })
          ),
        }),
      ],
    });

    // Send confirmation to reporter
    await interaction.reply({
      content:
        "Your anonymous report has been passed to the mods. Thank you for keeping ACM safe!",
      ephemeral: true,
    });
  }
}
