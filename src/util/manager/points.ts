import { MessageReaction, TextChannel, User, VoiceChannel } from "discord.js";
import Bot from "../../api/bot";
import { settings } from "../../settings";
import Manager from "../../api/manager";
import { EmbedBuilder } from "@discordjs/builders";

interface UserPointsData {
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  netId: string;
  tag: string;
  snowflake?: string;
  points?: number;
  activities?: any;
}

interface LeaderboardData {
  users: Array<string>;
  points: number;
}

export default class PointsManager extends Manager {
  privateChannelId: string;
  publicChannelId: string;
  staffRoleId: string;
  firebaseRoot: string;

  constructor(bot: Bot) {
    super(bot);
    this.privateChannelId = settings.points.privateChannel;
    this.publicChannelId = settings.points.publicChannel;
    this.staffRoleId = settings.points.staffRole;
    this.firebaseRoot = settings.points.firebaseRoot;
  }

  init() {}

  async handleReactionAdd(reaction: MessageReaction, user: User) {
    if (reaction.partial) await reaction.fetch();
    await reaction.users.fetch();
    const msg = await reaction.message.fetch();

    const guild = await this.bot.guilds.fetch(settings.guild);
    const member = await guild.members.fetch(user.id);

    const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;

    if (
      user.id === this.bot.user?.id ||
      msg.channel.id !== this.privateChannelId ||
      msg.author.id !== this.bot.user?.id ||
      !reaction.users.cache.has(this.bot.user?.id) ||
      reaction.emoji.name !== "✅" ||
      msg.embeds.length !== 1 ||
      !msg.embeds[0].title ||
      !msg.embeds[0].title!.startsWith("Response for") ||
      !msg.embeds[0].description ||
      !re.test(msg.embeds[0].description)
    )
      return;

    if (!member.roles.cache.has(this.staffRoleId)) {
      await reaction.users.remove(user.id);
      return this.bot.response.emit(
        msg.channel,
        `${user}, you are not authorized to approve points.`,
        "invalid"
      );
    }
    const encodedData = JSON.parse(
      decodeURIComponent(msg.embeds[0].description.match(re)![1])
    );
    await this.awardPoints(
      encodedData.points,
      encodedData.activity,
      new Set<string>([encodedData.snowflake])
    );
    reaction.message.reactions
      .removeAll()
      .then(() => reaction.message.react("🎉"));
    let embed = new EmbedBuilder({
      description: `**${user} has approved \`${encodedData.activity}\` for <@${encodedData.snowflake}>!**\n[link to original message](${msg.url})`,
    }).setColor([0, 255, 0]);
    if (msg.channel.isVoiceBased()) return;
    return msg.channel.send({ embeds: [embed] });
  }

  async handlePointsTypeform(typeformData: any) {
    const points: number = typeformData.form_response.calculated.score;
    const title: string = typeformData.form_response.definition.title;
    const answers: any = typeformData.form_response.answers;
    const confirmationChannel = (await this.bot.channels.fetch(
      this.privateChannelId
    )) as TextChannel;
    const resolvedSnowflakes: string[] = await this.netIdsToSnowflakes(
      new Set<string>([answers[0].text])
    );

    if (resolvedSnowflakes.length === 0)
      return this.bot.response.emit(
        confirmationChannel,
        `\`${answers[1].text}\` submitted \`${title}\` with an unknown NetID: \`${answers[0].text}\``,
        "error"
      );

    const userData = (await this.getUser(
      resolvedSnowflakes[0]
    )) as UserPointsData;
    const data = {
      snowflake: userData.snowflake,
      activity: answers[2].choice.label,
      points,
    };
    let embed = new EmbedBuilder({
      title: `Response for ${userData.full_name}`,
      description: `[\u200B](http://fake.fake?data=${encodeURIComponent(
        JSON.stringify(data)
      )})**Discord**: <@${userData.snowflake}>\n**NetID**: \`${
        userData.netId
      }\`\n**Activity**: \`${answers[2].choice.label}\`\n\n**Proof**:`,
      footer: {
        text: `${points} points will be awarded upon approval.`,
      },
    });
    if (answers[4].type === "text")
      embed.setDescription(
        embed.data.description + "\n*" + answers[4].text + "*"
      );
    else embed.setImage(answers[4].file_url);
    const msg = await confirmationChannel.send({ embeds: [embed] });
    await msg.react("✅");
  }

  async handleRegistrationTypeform(typeformData: any) {
    const notifChannel = (await this.bot.channels.fetch(
      this.privateChannelId
    )) as TextChannel;
    const answers: any = typeformData.form_response.answers;

    let mentorData: UserPointsData = {
      first_name: answers[0].text,
      last_name: answers[1].text,
      full_name: answers[0].text + " " + answers[1].text,
      email: answers[2].email.toLowerCase(),
      netId: answers[3].text.toLowerCase(),
      tag: answers[4].text,
    };
    let menteeData: UserPointsData = {
      first_name: answers[5].text,
      last_name: answers[6].text,
      full_name: answers[5].text + " " + answers[6].text,
      email: answers[7].email.toLowerCase(),
      netId: answers[8].text.toLowerCase(),
      tag: answers[9].text,
    };

    const mentorSnowflake = await this.registerUser(mentorData);
    const menteeSnowflake = await this.registerUser(menteeData, false);
    if (mentorSnowflake && menteeSnowflake) {
      this.bot.response.emit(
        notifChannel,
        `Registration completed for <@${mentorSnowflake}> (mentor) & <@${menteeSnowflake}> (mentee)`,
        "success"
      );
      await this.bot.managers.firestore.firestore
        ?.collection(this.firebaseRoot)
        .doc("pairs")
        .set(
          {
            [menteeSnowflake]: mentorSnowflake,
          },
          { merge: true }
        );
    } else {
      this.bot.response.emit(
        notifChannel,
        `Registration failed. Please ensure that both members are in this server and resubmit.`,
        "invalid"
      );
    }
  }

  async registerUser(data: UserPointsData, notify: boolean = true) {
    const notifChannel = (await this.bot.channels.fetch(
      this.privateChannelId
    )) as TextChannel;
    const guild = await this.bot.guilds.fetch(settings.guild);
    if (!guild) return;

    const member = await this.bot.managers.resolve.resolveGuildMember(
      data.tag,
      guild,
      new Set<string>(["tag"]),
      true
    );
    if (!member) {
      await notifChannel.send(
        `Err: Couldn't find user ${data.tag} (${data.full_name}).`
      );
      return;
    }
    data.snowflake = member.user.id;
    data.tag = member.user.tag;

    await this.bot.managers.firestore.firestore
      ?.collection(`${this.firebaseRoot}/users/profiles`)
      .doc(data.snowflake)
      .set(data, { merge: true });

    await this.bot.managers.firestore.firestore
      ?.collection(this.firebaseRoot)
      .doc("email_to_discord")
      .set({ [data.email]: data.snowflake }, { merge: true });

    await this.bot.managers.firestore.firestore
      ?.collection(this.firebaseRoot)
      .doc("netid_to_discord")
      .set({ [data.netId]: data.snowflake }, { merge: true });

    if (notify)
      await member
        .send({
          embeds: [
            new EmbedBuilder({
              title: "Mentor/Mentee Registration Confirmation",
              description: `Hello **${data.full_name}**, thank you for registering!\n`,
              footer: {
                text: "If you did not recently request this action, please contact an ACM staff member.",
              },
            }).setColor([236, 118, 33]),
          ],
        })
        .catch(() =>
          notifChannel.send(`DMs are off for ${data.tag} (${data.full_name})`)
        );
    return data.snowflake;
  }

  async handleGenericTypeform(typeformData: any) {
    const points: number = typeformData.form_response.calculated.score;
    const answers: any = typeformData.form_response.answers;
    const errChannel = (await this.bot.channels.fetch(
      this.privateChannelId
    )) as TextChannel;
    const title: string = typeformData.form_response.definition.title;

    const resolvedSnowflakes: string[] = await this.netIdsToSnowflakes(
      new Set<string>([answers[0].text])
    );
    if (resolvedSnowflakes.length === 0)
      return this.bot.response.emit(
        errChannel,
        `\`${answers[1].text}\` submitted \`${title}\` with an unknown NetID: \`${answers[0].text}\``,
        "error"
      );

    await this.awardPoints(
      points,
      title,
      new Set<string>([resolvedSnowflakes[0]])
    );
  }

  startReactionEvent(
    channelId: string,
    activityId: string,
    reactionId: string,
    moderatorId: string,
    points: number
  ) {
    if (this.bot.managers.indicator.hasKey("reactionEvent", channelId))
      return false;
    this.bot.managers.indicator.setKeyValue("reactionEvent", channelId, {
      channelId,
      activityId,
      reactionId,
      moderatorId,
      points,
    });
    return true;
  }

  stopReactionEvent(channelId: string) {
    if (!this.bot.managers.indicator.hasKey("reactionEvent", channelId))
      return false;
    this.bot.managers.indicator.removeKey("reactionEvent", channelId);
    return true;
  }

  startVoiceEvent(
    voiceChannel: VoiceChannel,
    activityId: string,
    moderatorId: string,
    points: number
  ) {
    const attendees = new Set<string>();
    if (this.bot.managers.indicator.hasKey("voiceEvent", voiceChannel.id))
      return false;
    for (const [, member] of voiceChannel.members) {
      if (member.user.bot) continue;
      attendees.add(member.id);
    }
    this.bot.managers.indicator.setKeyValue("voiceEvent", voiceChannel.id, {
      attendees,
      activityId,
      moderatorId,
      points,
    });
    return true;
  }

  stopVoiceEvent(voiceChannel: VoiceChannel) {
    const voiceEvent = this.bot.managers.indicator.getValue(
      "voiceEvent",
      voiceChannel.id
    );
    let originalAttendees: Set<string>;
    let trueAttendees = new Set<string>();
    if (!voiceEvent) return;
    originalAttendees = voiceEvent.attendees as Set<string>;

    this.bot.managers.indicator.removeKey("voiceEvent", voiceChannel.id);

    for (const [snowflake, member] of voiceChannel.members) {
      if (member.user.bot) continue;
      if (originalAttendees.has(snowflake)) trueAttendees.add(snowflake);
    }
    voiceEvent.attendees = trueAttendees;
    return voiceEvent;
  }

  async awardPoints(points: number, activity: string, awardees: Set<string>) {
    const success: string[] = [];
    const failure: string[] = [];

    for (const snowflake of awardees.values()) {
      const docRef = this.bot.managers.firestore.firestore
        ?.collection(`${this.firebaseRoot}/users/profiles`)
        .doc(snowflake);
      const doc = await docRef?.get();

      if (!doc || !doc.exists) {
        failure.push(`<@${snowflake}>`);
        continue;
      }

      const userData = doc.data()! as UserPointsData;
      if (!userData.activities) userData.activities = { [activity]: points };
      else
        userData.activities[activity] =
          (userData.activities[activity] || 0) + points;
      userData.points = (userData.points || 0) + points;
      await docRef?.set(userData);
      success.push(`<@${snowflake}>`);
    }
    if (activity !== "Discord") {
      const logChannel = (await this.bot.channels.fetch(
        this.publicChannelId
      )) as TextChannel;
      if (success.length > 60)
        await logChannel.send({
          content: `Awarded ${points} to ${success.length} users for ${activity}.`,
          allowedMentions: { parse: [] },
        });
      else if (success.length !== 0)
        await logChannel.send({
          content: `Awarded ${points} points to ${success.join(
            ", "
          )} for ${activity}.`,
          allowedMentions: { users: [] },
        });
    }
    console.log(
      `Awarded ${points} to ${success.length}/${awardees.size} users for ${activity}.`
    );
    return { success, failure };
  }

  async getUser(snowflake: string) {
    let exists: boolean | undefined;
    let data: UserPointsData | undefined;
    await this.bot.managers.firestore.firestore
      ?.collection(`${this.firebaseRoot}/users/profiles`)
      .doc(snowflake)
      .get()
      .then(async (doc) => {
        exists = doc.exists;
        data = doc.data() as UserPointsData;
      });
    if (data !== undefined && data.points === undefined) data.points = 0;
    return data;
  }

  async emailsToSnowflakes(emails: Set<string>): Promise<string[]> {
    const snowflakes: string[] = [];
    await this.bot.managers.firestore.firestore
      ?.collection(this.firebaseRoot)
      .doc("email_to_discord")
      .get()
      .then(async (doc) => {
        if (!doc.exists || !doc.data()) return [];
        const rawData = doc.data()!;
        let data: any = {};
        for (const email in rawData) {
          data[email.toLowerCase()] = rawData[email];
        }
        for (let email of emails.values()) {
          email = email.toLowerCase();
          if (email in data) {
            snowflakes.push(data[email]);
          }
        }
      });
    return snowflakes;
  }

  async netIdsToSnowflakes(netIds: Set<string>): Promise<string[]> {
    const snowflakes: string[] = [];
    await this.bot.managers.firestore.firestore
      ?.collection(this.firebaseRoot)
      .doc("netid_to_discord")
      .get()
      .then(async (doc) => {
        if (!doc.exists || !doc.data()) return [];
        const rawData = doc.data()!;
        let data: any = {};
        for (const netId in rawData) {
          data[netId.toLowerCase()] = rawData[netId];
        }
        for (let netId of netIds.values()) {
          netId = netId.toLowerCase();
          if (netId in data) {
            snowflakes.push(data[netId]);
          }
        }
      });
    return snowflakes;
  }

  async getLeaderboard(type: "mentee" | "mentor" | "both" = "both", limit = 0) {
    let res: LeaderboardData[] = [];
    const individualData: Map<string, UserPointsData> = new Map<
      string,
      UserPointsData
    >();
    const snapshot = await this.bot.managers.firestore.firestore
      ?.collection(`${this.firebaseRoot}/users/profiles`)
      .get();
    snapshot?.forEach((doc) => {
      individualData.set(doc.id, doc.data() as UserPointsData);
    });
    const pairs = await (
      await this.bot.managers.firestore.firestore
        ?.collection(this.firebaseRoot)
        .doc("pairs")
        .get()!
    ).data();
    switch (type) {
      case "mentee":
        res = Object.keys(pairs!).map((mentee) => ({
          users: [mentee],
          points: individualData.get(mentee)!.points || 0,
        }));
        break;
      case "mentor":
        for (const mentor of Object.values(pairs!)) {
          if (!res.find((data) => data.users[0] === mentor)) {
            res.push({
              users: [mentor],
              points: individualData.get(mentor)!.points || 0,
            });
          }
        }
        for (const [mentee, mentor] of Object.entries(pairs!)) {
          let mentorData = res.find((data) => data.users[0] === mentor)!;
          const activities = individualData.get(mentee)!.activities;
          mentorData.points +=
            activities && activities["Mentor/ Mentee Meeting"]
              ? activities["Mentor/ Mentee Meeting"]
              : 0;
        }
        break;
      case "both":
        res = Object.entries(pairs!).map(([mentee, mentor]) => {
          const menteeData = individualData.get(mentee)!;
          const mentorData = individualData.get(mentor)!;
          return {
            users: [mentee, mentor],
            points: (menteeData?.points || 0) + (mentorData?.points || 0),
          };
        });
        break;
    }
    res.sort((a, b) => b.points - a.points);
    return limit > 0 ? res.slice(0, limit) : res;
  }
}
