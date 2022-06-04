import {
  ButtonInteraction,
  GuildMember, MessageActionRow,
  MessageButton, Modal,
  ModalSubmitInteraction,
  TextInputComponent
} from "discord.js";
import Bot from "../../api/bot";
import Manager from "../../api/manager";

export default class VerificationManager extends Manager {
  private readonly verificationChannelID: string;
  private readonly memberRoleID: string;

  constructor(bot: Bot) {
    super(bot);
    this.verificationChannelID = bot.settings.channels.verification;
    this.memberRoleID = bot.settings.roles.member;

    this.bot = bot;
  }

  public async init() {
    // Ensure the verification channel's last message has a verification button to the bot
    const guild = await this.bot.guilds.fetch(this.bot.settings.guild);
    const verificationChannel = await guild.channels.fetch(
      this.verificationChannelID
    );

    if (
      verificationChannel === null ||
      verificationChannel.type != "GUILD_TEXT"
    ) {
      this.bot.logger.error("Could not resolve verification channel");
      return;
    }

    let messages = await verificationChannel.messages.fetch({ limit: 1 });
    messages = messages.filter(
      (m) => m.author.id == this.bot.user!.id && m.components.length > 0
    );
    if (messages.size <= 0) {
      const actionRow = new MessageActionRow({
        components: [
          new MessageButton({
            label: "Accept rules and verify",
            customId: `verification-button`,
            style: "SUCCESS",
          }),
        ],
      });

      await verificationChannel.send({
        components: [actionRow],
      });
    }
  }

  public async handleVerificationRequest(interaction: ButtonInteraction) {
    // Prompt for real name using modal
    const nameInput = new TextInputComponent({
      customId: "name",
      label: "Full name | Ex: Tee Mock (he/him)",
      style: "SHORT",
    });

    const modal = new Modal({
      customId: "verification-modal",
      title: "Verify",
      components: [
        new MessageActionRow<TextInputComponent>().addComponents([nameInput]),
      ],
    });

    await interaction.showModal(modal);
  }

  public async handleVerificationSubmit(interaction: ModalSubmitInteraction) {
    if (interaction.guild !== null) {
      try {
        const member = await interaction.guild.members.fetch(
          interaction.user.id
        );
        const name = interaction.fields.getTextInputValue("name");

        // Modify member nickname and roles
        await member.setNickname(name);
        await member.roles.add(this.memberRoleID);

        // Add to firebase
        let map: any = {};
        map[member.id] = name;
        this.bot.managers.firestore.firestore
          ?.collection("discord")
          .doc("snowflake_to_name")
          .set(map, { merge: true });

        // Reply
        await interaction.reply({
          content: `Thank you for verifying! To join to more channels, visit <#${this.bot.settings.circles.joinChannel}>.`,
          ephemeral: true,
        });

        return;
      } catch (err: any) {
        this.bot.logger.error(err);
      }
    }
  }
}
