import { ButtonBuilder } from "@discordjs/builders";
import Manager from "../../api/manager";
import Bot from "../../api/bot";
import {
  ButtonInteraction,
  ButtonStyle,
  ContextMenuCommandInteraction,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { v4 } from "uuid";
import assert from "assert";
import ReportModal from "../../interaction/modal/report";
import { ActionRowBuilder, EmbedBuilder } from "@discordjs/builders";

interface Report {
  message: Message;
  originalInteraction: ContextMenuCommandInteraction;
}

const reportCategories = [
  // Container for holding in-progress reports
  "Offensive",
  "Spam & Ads",
  "Illegal or NSFW",
  "Uncomfortable",
  "Other",
];
/**
 * Anonymous report system logic
 */
export default class ReportManager extends Manager {
  // IMPORTANT: NO MORE THAN 5 BUTTONS/ROW, WHICH MEANS ONLY UP TO 5 CATEGORIES

  private reports = new Map<string, Report>();

  constructor(bot: Bot) {
    super(bot);
  }

  public init(): void {}

  public async handleInitialReport(
    interaction: MessageContextMenuCommandInteraction
  ) {
    // Immediately fetch message
    const message = interaction.options.getMessage("message", true);

    // Generate a report ID
    const reportId = v4().toString();

    // Add report to the collection
    this.reports.set(reportId, {
      message,
      originalInteraction: interaction,
    });

    // Prompt for report category.
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      reportCategories.map(
        (cat) =>
          new ButtonBuilder({
            label: cat,
            custom_id: `report/${reportId}/${cat}`,
            style: ButtonStyle.Primary,
          })
      )
    );

    const content = `[Link to message](${message.url})`;

    const embed = new EmbedBuilder({
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
    const reportId = match![1];
    const category = match![2];

    // Fetch report from storage
    let report = this.reports.get(reportId);
    if (!report) {
      await interaction.reply({
        content:
          "It looks like you're trying to respond to a previous interaction.",
        ephemeral: true,
      });
      return;
    }
    this.reports.delete(reportId);
    const { message, originalInteraction } = report;

    let userReportMessage: string | undefined;
    if (category === "Other") {
      const report = new ReportModal();

      await interaction.showModal(report);
      await interaction.awaitModalSubmit({ time: 20000 }).then((res) => {
        userReportMessage = res.fields.getTextInputValue("report-text");
        res.reply({
          content: "Your report has been submitted.",
          ephemeral: true,
        });
      });
    }

    // Build report to send out
    const reportContent =
      `**Report ${reportId}**\n` +
      `Category: *${category}*\n` +
      `In case the user changes names, here is a mention: <@${message.author.id}>`;

    const embed = new EmbedBuilder({
      author: {
        name: `${message.member?.displayName} (${message.author.username}#${message.author.discriminator})`,
        icon_url: message.member?.displayAvatarURL(),
      },
      title: "link to message",
      url: message.url,
      description: message.content,
    }).setTimestamp(message.createdTimestamp);
    if (userReportMessage !== undefined) {
      embed.addFields({
        name: "User's report message",
        value: userReportMessage,
      });
    }

    const modChannel = await this.bot.channels.fetch(
      this.bot.settings.channels.mod
    );
    assert.ok(modChannel!.isTextBased());

    // Send report
    modChannel.send({
      content: reportContent,
      embeds: [embed],
      allowedMentions: { users: [] },
    });

    const actionRow = getReportComponents(reportId, true);
    // Remove buttons
    await originalInteraction.editReply({
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          reportCategories.map(
            (cat) =>
              new ButtonBuilder({
                label: cat,
                custom_id: `report/${reportId}/${cat}`,
                disabled: true,
                style: ButtonStyle.Primary,
              })
          )
        ),
      ],
    });

    // Send confirmation to reporter
    await interaction.editReply({
      content:
        "Your anonymous report has been passed to the mods. Thank you for keeping ACM safe!",
    });
  }
}

const getReportComponents = (reportId: string, disabled = false) => {
  const buttons = reportCategories.map(
    (cat) =>
      new ButtonBuilder({
        custom_id: `report/${reportId}/${cat}`,
        label: cat,
        style: ButtonStyle.Primary,
        disabled,
      })
  );

  // Prompt for report category.
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttons
  );

  return actionRow;
};
