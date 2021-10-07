import { settings } from "../settings";
import {
  Message,
  MessageAttachment,
  MessageEmbed,
  StageChannel,
  User,
  VoiceChannel,
} from "discord.js";
import Command, { CommandContext } from "../api/command";
import Bot from "../api/bot";
import axios from "axios";

export default class PointsCommand extends Command {
  constructor() {
    super({
      name: "points",
      description: "Suite of commands to manage the points system",
      longDescription:
        "Suite of commands to manage the points system.\n" +
        "You can check and award points, display the leaderboard, or hold a weighted raffle.\n" +
        "Most options also have an alias for ease of use:\n" +
        "`check`: `c`\n" +
        "`award`: `a`\n" +
        "`leaderboard`: `lb`\n" +
        "`raffle`: `r`",
      usage: [
        "points check [user]",
        "points award <amount> <activity-id> [user1 [user2 [user3 ...]]]",
        "points leaderboard <mentee|mentor|both> [limit=0 (all)]",
        "points raffle [winners=1]",
        "points vcevent <amount> <activity-id> <threshold-minutes>",
        "points vcsnapshot <amount> <activity-id>",
      ],
      dmWorks: false,
      requiredRoles: [settings.points.staffRole],
    });
  }

  public async exec({ msg, bot, args }: CommandContext) {
    if (!msg.guild) {
      // shouldn't ever happen, but we"re gonna include it just for typescript 😄
      await msg.reply("This command cannot be run in DMs!");
      return;
    }

    if (args.length < 1) return this.sendInvalidUsage(msg, bot);

    switch (args[0].toLowerCase()) {
      case "check":
      case "c": {
        // default to the author if arg not included
        let user: User | undefined | null = msg.author;

        if (args.length > 1) {
          const unresolvedUser = args[1];
          user = undefined;

          if (/.+@.+\..+/.test(unresolvedUser)) {
            // email resolve
            const users = await bot.managers.points.emailsToSnowflakes(
              new Set([unresolvedUser])
            );
            if (users.length == 1) {
              // email find, now resolve by userID
              user = await bot.users.resolve(users[0]);
            }
          } else {
            // discord resolve (nickname, username, id, etc)
            const member = await bot.managers.resolve.resolveGuildMember(
              unresolvedUser,
              msg.guild
            );
            user = member?.user;
          }

          if (!user) {
            await bot.response.emit(
              msg.channel,
              `I couldn't anyone named \`${unresolvedUser}\`.`,
              "invalid"
            );
            return;
          }
        }

        const data = await bot.managers.points.getUser(user.id);
        if (data != undefined) {
          // we build a nice embed scorecard
          let scorecardEmbed = new MessageEmbed({
            color: "#93c2db",
            author: {
              name: `${user.tag} (${data.full_name})`,
              iconURL: user.avatarURL() ?? "",
            },
            title: `${data?.points} points`,
            description: "\n",
            footer: {
              text: "ACM Education",
              iconURL: "https://i.imgur.com/THllTFL.png",
            },
          });

          // add score breakdown if it exists
          let userActivities = [];
          if (data?.activities) {
            for (let activity in data?.activities) {
              userActivities.push(
                `**${activity}**: ${data?.activities[activity]}`
              );
            }
            // now we sort userActivities, case-insensitive
            userActivities.sort((a, b) => {
              return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            // finally, add to description
            scorecardEmbed.description =
              "__**Activities**__\n" + userActivities.join("\n");
          }

          await msg.channel.send({ embeds: [scorecardEmbed] });
          return;
        } else {
          await bot.response.emit(
            msg.channel,
            `${user} doesn't seem to be registered in the system.`,
            "invalid"
          );
          return;
        }
      }

      case "award":
      case "a": {
        if (args.length < 3) {
          await bot.response.emit(
            msg.channel,
            `Award some points to user(s) for completing some activity.\n` +
              `Specify the users by pinging them or attaching a zoom attendance sheet.\n` +
              `Usage: \`${bot.settings.prefix}${this.usage[1]}\`\n`,
            "invalid"
          );
          return;
        }

        const unresolvedPoints = args[1];
        const activityId = args[2];
        const awardees = new Set<string>();

        const points = +unresolvedPoints;

        // invalid award amount
        if (isNaN(points)) {
          await bot.response.emit(
            msg.channel,
            `\`${unresolvedPoints}\` is not a valid number.`,
            "invalid"
          );
          return;
        }

        // scan message for userIds. This will catch mentions but not usernames/tags
        msg.content.match(/[\d]{17,18}/g)?.forEach((userId) => {
          awardees.add(userId);
        });

        // also scan message for usernames
        for (const arg of args) {
          const user = await bot.managers.resolve.resolveGuildMember(
            arg,
            msg.guild!,
            new Set<string>(["tag"]),
            false
          );
          if (user) awardees.add(user.id);
        }

        // process awardees inn the attachment
        let attachmentAwardees = await processAttachments(bot, msg);
        for (const id of attachmentAwardees) {
          awardees.add(id);
        }

        const { success, failure } = await bot.managers.points.awardPoints(
          points,
          activityId,
          awardees
        );

        // send back our results with mentions but not pings
        await msg.reply({
          content:
            `Awarded **${points}** points to **${
              success.length
            }** users for completing **${activityId}**:\n${success.join(
              " "
            )}\n` +
            (failure.length
              ? `${failure.length} users were not registered: ${failure.join(
                  " "
                )}`
              : ""),
          allowedMentions: { parse: [] },
        });
        return;
      }

      case "leaderboard":
      case "lb": {
        if (
          args.length < 2 ||
          (args[1] != "mentee" && args[1] != "mentor" && args[1] != "both")
        ) {
          await bot.response.emit(
            msg.channel,
            `Usage: \`${bot.settings.prefix}${this.usage[2]}\`\n`,
            "invalid"
          );
          return;
        }

        const filter = args[1];
        const unresolvedNumUsers = args[2];
        let numUsers = 0; // default to all

        if (unresolvedNumUsers) {
          numUsers = +unresolvedNumUsers;

          // invalid number of users
          if (isNaN(numUsers)) {
            await bot.response.emit(
              msg.channel,
              `\`${numUsers}\` is not a valid number.`,
              "invalid"
            );
            return;
          }
        }

        const allPairs = await bot.managers.points.getLeaderboard(
          filter,
          numUsers
        );

        let descriptionArr: string[] = [];
        allPairs.forEach((pair, i) => {
          if (pair.points > 0)
            descriptionArr.push(
              `\`${i + 1}\`. <@${pair.users.join(">+<@")}>: ${
                pair.points
              } points`
            );
        });

        await msg.channel.send({
          embeds: [
            new MessageEmbed({
              title: "Leaderboard",
              description: descriptionArr.join("\n"),
            }),
          ],
        });
        return;
      }

      case "raffle":
      case "r": {
        const allPairs = await bot.managers.points.getLeaderboard("both");
        const unresolvedNumWinners = args[1];
        let sum = 0;
        let numWinners: number;
        let winningNumbers = new Set<number>();
        let winningUsers: string[] = [];
        let processedTickets = 0;

        if (unresolvedNumWinners) {
          numWinners = +unresolvedNumWinners;

          // invalid number of winners
          if (isNaN(numWinners) || numWinners < 1 || numWinners > 50) {
            await bot.response.emit(
              msg.channel,
              `\`${unresolvedNumWinners}\` is not a valid number of winners between 1 and 50 (inclusive).`,
              "invalid"
            );
            return;
          }
        } else {
          // default to 1 winner
          numWinners = 1;
        }

        // first, we want to find the sum of all points for pairs with > 0 points
        const filteredPairs = allPairs.filter((pair) => pair.points > 0);
        filteredPairs.forEach((pair) => {
          sum += pair.points;
        });

        // now we want to generate random numbers accordingly
        for (let i = 0; i < numWinners; i++) {
          winningNumbers.add(Math.random() * sum);
        }

        // pick out winners
        for (let pair of filteredPairs) {
          let winnerCount = 0;
          processedTickets += pair.points;
          // count up all the winning tickets
          winningNumbers.forEach((ticket) => {
            if (ticket < processedTickets) {
              winnerCount++;
              winningNumbers.delete(ticket);
            }
          });

          // add the winning count to the person's stats
          if (winnerCount > 0)
            winningUsers.push(`<@${pair.users.join(">+<@")}>: ${winnerCount}`);

          // stop processing once all the winning numbers are gone
          if (winningNumbers.size == 0) break;
        }

        await msg.channel.send({
          embeds: [
            new MessageEmbed({
              title: "🎉 The winners (and how many times they won)",
              description: winningUsers.join("\n"),
            }),
          ],
        });
        return;
      }
      case "vcevent":
        if (args.length < 4) {
          return bot.response.emit(
            msg.channel,
            `Stop a vc event and award points to users who stay for some duration.\n` +
              `Usage: \`${bot.settings.prefix}${this.usage[4]}\`\n`,
            "invalid"
          );
        }

        const unresolvedPoints = args[1];
        const unresolvedThreshold = args[3];
        const activityId = args[2];
        let attendees = new Set<string>();
        let voiceChannel: VoiceChannel | StageChannel | null | undefined;
        const points = +unresolvedPoints;
        const threshold = +unresolvedThreshold;

        // invalid award amount
        if (isNaN(points)) {
          await bot.response.emit(
            msg.channel,
            `\`${unresolvedPoints}\` is not a valid number.`,
            "invalid"
          );
          return;
        }
        // invalid threshold amount
        if (isNaN(threshold)) {
          await bot.response.emit(
            msg.channel,
            `\`${unresolvedThreshold}\` is not a valid number.`,
            "invalid"
          );
          return;
        }
        // attempt to resolve the vc
        voiceChannel = msg.member?.voice.channel;
        if (!voiceChannel) {
          await bot.response.emit(
            msg.channel,
            `Please join a voice channel!`,
            "invalid"
          );
          return;
        }
        const data = bot.managers.activity.stopVoiceEvent(voiceChannel);
        if (!data) {
          await bot.response.emit(
            msg.channel,
            `No VC Event is running in ${voiceChannel}`,
            "error"
          );
          return;
        } else {
          let sorted = Array.from(data.keys()).sort(
            (a, b) => data.get(b)! - data.get(a)!
          );
          let descriptionArr: string[] = [];

          sorted.forEach((userID, i) => {
            const time = Math.round(data.get(userID)! / 60000);
            descriptionArr.push(
              `\`${i + 1}\`. <@${userID}>: ${time} minute${
                time == 1 ? "" : "s"
              }`
            );
            if (time >= threshold) attendees.add(userID);
          });

          const { success, failure } = await bot.managers.points.awardPoints(
            points,
            activityId,
            attendees
          );

          await msg.channel.send({
            embeds: [
              new MessageEmbed({
                title: "Time spent in VC",
                description: descriptionArr.join("\n"),
              }),
            ],
          });

          await msg.reply({
            content:
              `Awarded **${points}** points to **${
                success.length
              }** users for completing **${activityId}**:\n${success.join(
                " "
              )}\n` +
              (failure.length
                ? `${failure.length} users were not registered: ${failure.join(
                    " "
                  )}`
                : ""),
            allowedMentions: { parse: [] },
          });
          return;
        }

      case "vcsnapshot": {
        if (args.length < 3) {
          await bot.response.emit(
            msg.channel,
            `Award some points to user(s) in your current voice channel.\n` +
              `Usage: \`${bot.settings.prefix}${this.usage[5]}\`\n`,
            "invalid"
          );
          return;
        }

        const unresolvedPoints = args[1];
        const activityId = args[2];
        let attendees = new Set<string>();
        let voiceChannel: VoiceChannel | StageChannel | null | undefined;
        const points = +unresolvedPoints;

        // invalid award amount
        if (isNaN(points)) {
          await bot.response.emit(
            msg.channel,
            `\`${unresolvedPoints}\` is not a valid number.`,
            "invalid"
          );
          return;
        }

        // attempt to resolve the vc
        voiceChannel = msg.member?.voice.channel;
        if (!voiceChannel) {
          await bot.response.emit(
            msg.channel,
            `Please join a voice channel!`,
            "invalid"
          );
          return;
        }

        for (const [, member] of voiceChannel.members) {
          if (member.user.bot) continue;
          attendees.add(member.id);
        }

        const { success, failure } = await bot.managers.points.awardPoints(
          points,
          activityId,
          attendees
        );

        await msg.reply({
          content:
            `Awarded **${points}** points to **${
              success.length
            }** users for completing **${activityId}**:\n${success.join(
              " "
            )}\n` +
            (failure.length
              ? `${failure.length} users were not registered: ${failure.join(
                  " "
                )}`
              : ""),
          allowedMentions: { parse: [] },
        });
        return;
      }

      default:
        await this.sendInvalidUsage(msg, bot);
        return;
    }
  }
}

async function processAttachments(client: Bot, msg: Message) {
  let awardees = new Set<string>();
  if (msg.attachments.size == 0) return;
  await Promise.all(
    msg.attachments.map(async (val) => {
      let attachmentAwardees = await processCSV(client, val);
      attachmentAwardees?.forEach((id) => {
        awardees.add(id);
      });
    })
  );
  return awardees;
}

async function processCSV(
  bot: Bot,
  attachment: MessageAttachment
): Promise<Set<string>> {
  let csvRaw: string;
  const netIds = new Set<string>();
  const emails = new Set<string>();

  try {
    csvRaw = (await axios.get(attachment.url)).data;
    const csvLines = csvRaw.split(/\r?\n/);
    // determine email column
    const headers = csvLines[0].split(",");
    const emailColNum = headers.indexOf("Email");
    const netIdColNum = headers.indexOf("NetID");

    // extract emails from remaining csv
    for (let lineNum = 1; lineNum < csvLines.length; lineNum++) {
      const fields = csvLines[lineNum].split(",");
      if (emailColNum !== -1) {
        emails.add(fields[emailColNum]);
      }
      if (netIdColNum !== -1) {
        netIds.add(fields[netIdColNum]);
      }
    }
  } catch (error) {
    return new Set<string>();
  }

  const snowflakes: string[] = [];
  if (emails.size > 0)
    snowflakes.push(...(await bot.managers.points.emailsToSnowflakes(emails)));
  if (netIds.size > 0)
    snowflakes.push(...(await bot.managers.points.netIdsToSnowflakes(netIds)));
  return new Set(snowflakes);
}
