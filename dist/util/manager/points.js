"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const settings_1 = require("../../settings");
const firestore_1 = require("@google-cloud/firestore");
const manager_1 = __importDefault(require("../../api/manager"));
class PointsManager extends manager_1.default {
    constructor(bot) {
        super(bot);
        this.privateChannelId = settings_1.settings.points.privateChannel;
        this.publicChannelId = settings_1.settings.points.publicChannel;
        this.staffRoleId = settings_1.settings.points.staffRole;
    }
    init() { }
    handleReactionAdd(reaction, user) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (reaction.partial)
                yield reaction.fetch();
            yield reaction.users.fetch();
            const msg = yield reaction.message.fetch();
            const guild = yield this.bot.guilds.fetch(settings_1.settings.guild);
            const member = yield guild.members.fetch(user.id);
            const re = /\[\u200B\]\(http:\/\/fake\.fake\?data=(.*?)\)/;
            if (user.id === ((_a = this.bot.user) === null || _a === void 0 ? void 0 : _a.id) || msg.channel.id !== this.privateChannelId || msg.author.id !== ((_b = this.bot.user) === null || _b === void 0 ? void 0 : _b.id) || !reaction.users.cache.has((_c = this.bot.user) === null || _c === void 0 ? void 0 : _c.id) || reaction.emoji.name !== "✅" || msg.embeds.length !== 1 || !msg.embeds[0].title || !msg.embeds[0].title.startsWith("Response for") || !msg.embeds[0].description || !re.test(msg.embeds[0].description))
                return;
            if (!member.roles.cache.has(this.staffRoleId)) {
                reaction.users.remove(user.id);
                return this.bot.response.emit(msg.channel, `${user}, you are not authorized to approve points...`, 'invalid');
            }
            const encodedData = JSON.parse(decodeURIComponent(msg.embeds[0].description.match(re)[1]));
            this.awardPoints(encodedData.points, encodedData.activity, new Set([encodedData.snowflake]));
            reaction.message.reactions.removeAll().then(() => reaction.message.react("🎉"));
            let embed = new discord_js_1.MessageEmbed({
                color: 'GREEN',
                description: `**${user} has approved \`${encodedData.activity}\` for <@${encodedData.snowflake}>!**\n[link to original message](${msg.url})`
            });
            return msg.channel.send(embed);
        });
    }
    handlePointsTypeform(typeformData) {
        return __awaiter(this, void 0, void 0, function* () {
            const points = typeformData.form_response.calculated.score;
            const title = typeformData.form_response.definition.title;
            const answers = typeformData.form_resopnse.answers;
            const confirmationChannel = (yield this.bot.channels.fetch(this.privateChannelId));
            const resolvedSnowflakes = yield this.emailsToSnowflakes(new Set([answers[0].email]));
            if (resolvedSnowflakes.length === 0)
                return this.bot.response.emit(confirmationChannel, `\`${answers[1].text}\` submitted \`${title}\` with an unknown email: \`${answers[0].email}\``, 'error');
            const userData = yield this.getUser(resolvedSnowflakes[0]);
            const data = {
                snowflake: userData.snowflake,
                activity: answers[2].choice.label,
                points
            };
            let embed = new discord_js_1.MessageEmbed({
                title: `Response for ${userData.full_name}`,
                description: `[\u200B](http://fake.fake?data=${encodeURIComponent(JSON.stringify(data))})**Discord**: <@${userData.snowflake}>\n**Email**: \`${userData.email}\`\n**Activity**: \`${answers[2].choice.label}\`\n\n**Proof**:`,
                footer: {
                    text: `${points} points will be awarded upon approval...`
                }
            });
            if (answers[4].type === 'text')
                embed.description += "\n*" + answers[4].text + "*";
            else
                embed.image = { url: answers[4].file_url };
            const msg = yield confirmationChannel.send(embed);
            yield msg.react("✅");
        });
    }
    handleRegistrationTypeform(typeformData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const notifChannel = (yield this.bot.channels.fetch(this.privateChannelId));
            const answers = typeformData.form_response.answers;
            let mentorData = {
                first_name: answers[0].text,
                last_name: answers[1].text,
                full_name: answers[0].text,
                email: answers[2].email.toLowerCase(),
                tag: answers[3].text
            };
            let menteeData = {
                first_name: answers[4].text,
                last_name: answers[5].text,
                full_name: answers[4].text + ' ' + answers[5].text,
                email: answers[6].email.toLowercase(),
                tag: answers[7].text
            };
            const mentorSnowflake = yield this.registerUser(mentorData);
            const menteeSnowflake = yield this.registerUser(menteeData, false);
            if (mentorSnowflake && menteeSnowflake) {
                this.bot.response.emit(notifChannel, `Registration completed for <@${mentorSnowflake}> (mentor) & <@${menteeSnowflake}> (mentee)`, 'success');
                yield ((_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system").doc('pairs').set({
                    [menteeSnowflake]: mentorSnowflake
                }, { merge: true }));
            }
            else {
                this.bot.response.emit(notifChannel, `Registration failed. Please ensure that both members are in thi server and resubmit...`, 'invalid');
            }
        });
    }
    registerUser(data, notify = true) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const notifChannel = (yield this.bot.channels.fetch(this.privateChannelId));
            const guild = yield this.bot.guilds.fetch(settings_1.settings.guild);
            if (!guild)
                return;
            const member = yield this.bot.managers.resolve.resolveGuildMember(data.tag, guild, new Set(['tag']), true);
            if (!member) {
                notifChannel.send(`Err: Couldn't find user ${data.tag} (${data.full_name})...`);
                return;
            }
            data.snowflake = member.user.id;
            data.tag = member.user.tag;
            yield ((_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system/users/profiles").doc(data.snowflake).set(data, { merge: true }));
            yield ((_b = this.bot.managers.firestore.firestore) === null || _b === void 0 ? void 0 : _b.collection("points_system").doc('email_to_discord').set({ [data.email]: data.snowflake }, { merge: true }));
            if (notify)
                yield member.send(new discord_js_1.MessageEmbed({
                    color: '#ec7621',
                    title: 'Mentor/Mentee Registration Confirmation',
                    description: `Hello **${data.full_name}**, thank you for registering!\n`,
                    footer: { text: 'If you did not recently request this action, please conteact an ACM staff member...' }
                })).catch((e) => notifChannel.send(`DMs are off for ${data.tag} (${data.full_name})`));
            return data.snowflake;
        });
    }
    handleGenericTypeform(typeformData) {
        return __awaiter(this, void 0, void 0, function* () {
            const points = typeformData.form_response.calculated.score;
            const answers = typeformData.form_response.answers;
            const errChannel = (yield this.bot.channels.fetch(this.privateChannelId));
            const title = typeformData.form_response.definition.title;
            const resolvedSnowflakes = yield this.emailsToSnowflakes(new Set([answers[0].email]));
            if (resolvedSnowflakes.length === 0)
                return this.bot.response.emit(errChannel, `\`${answers[1].text}\` submitted \`${title}\` with an unknown email: \`${answers[0].email}\``, 'error');
            yield this.awardPoints(points, title, new Set([resolvedSnowflakes[0]]));
        });
    }
    startReactionEvent(channelId, activityId, reactionId, moderatorId, points) {
        if (this.bot.managers.indicator.hasKey('reactionEvent', channelId))
            return false;
        this.bot.managers.indicator.setKeyValue('reactionEvent', channelId, { channelId, activityId, reactionId, moderatorId, points });
        return true;
    }
    stopReactionEvent(channelId) {
        if (!this.bot.managers.indicator.hasKey('reactionEvent', channelId))
            return false;
        this.bot.managers.indicator.removeKey('reactionEvent', channelId);
        return true;
    }
    startVoiceEvent(voiceChannel, activityId, moderatorId, points) {
        const attendees = new Set();
        if (this.bot.managers.indicator.hasKey('voiceEvent', voiceChannel.id))
            return false;
        for (const [, member] of voiceChannel.members) {
            if (member.user.bot)
                continue;
            attendees.add(member.id);
        }
        this.bot.managers.indicator.setKeyValue('voiceEvent', voiceChannel.id, { attendees, activityId, moderatorId, points });
        return true;
    }
    stopVoiceEvent(voiceChannel) {
        const voiceEvent = this.bot.managers.indicator.getValue('voiceEvent', voiceChannel.id);
        let originalAttendees;
        let trueAttendees = new Set();
        if (!voiceEvent)
            return;
        originalAttendees = voiceEvent.attendees;
        this.bot.managers.indicator.removeKey('voiceEvent', voiceChannel.id);
        for (const [snowflake, member] of voiceChannel.members) {
            if (member.user.bot)
                continue;
            if (originalAttendees.has(snowflake))
                trueAttendees.add(snowflake);
        }
        voiceEvent.attendees = trueAttendees;
        return voiceEvent;
    }
    awardPoints(points, activity, awardees) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const success = [];
            const failure = [];
            let activities = {};
            const icrement = firestore_1.FieldValue.increment(points);
            for (const snowflake of awardees.values()) {
                const docRef = (_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system/users/profiles").doc(snowflake);
                const doc = yield (docRef === null || docRef === void 0 ? void 0 : docRef.get());
                if (!doc || !doc.exists) {
                    failure.push(`<@${snowflake}>`);
                    continue;
                }
                const userData = doc.data();
                if (!userData.activities)
                    userData.activities = { [activity]: points };
                else
                    userData.activities[activity] = (userData.activities[activity] || 0) + points;
                userData.points = (userData.points || 0) + points;
                yield (docRef === null || docRef === void 0 ? void 0 : docRef.set(userData));
                success.push(`<@${snowflake}>`);
            }
            if (activity !== 'Discord') {
                const logChannel = yield this.bot.channels.fetch(this.publicChannelId);
                if (success.length > 60)
                    logChannel.send(`Awarded ${points} to ${success.length} users for ${activity}...`, { "allowedMentions": { "users": [] } });
                else if (success.length !== 0)
                    logChannel.send(`Awarded ${points} points to ${success.join(', ')} for ${activity}...`, { "allowedMentions": { "users": [] } });
            }
            console.log(`Awarded ${points} to ${success.length}/${awardees.size} users for ${activity}...`);
            return { success, failure };
        });
    }
    getUser(snowflake) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let exists;
            let data;
            yield ((_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system/users/profiles").doc(snowflake).get().then((doc) => __awaiter(this, void 0, void 0, function* () {
                exists = doc.exists;
                data = doc.data();
            })));
            if (data !== undefined && data.points === undefined)
                data.points = 0;
            return data;
        });
    }
    emailsToSnowflakes(emails) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const snowflakes = [];
            yield ((_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system").doc("email_to_discord").get().then((doc) => __awaiter(this, void 0, void 0, function* () {
                if (!doc.exists || !doc.data())
                    return [];
                const rawData = doc.data();
                let data = {};
                for (const email in rawData) {
                    data[email.toLowerCase()] = rawData[email];
                }
                for (let email of emails.values()) {
                    email = email.toLowerCase();
                    if (email in data) {
                        snowflakes.push(data[email]);
                    }
                }
            })));
            return snowflakes;
        });
    }
    getLeaderboard(type = 'both', limit = 0) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let res = [];
            const individualData = new Map();
            const snapshot = yield ((_a = this.bot.managers.firestore.firestore) === null || _a === void 0 ? void 0 : _a.collection("points_system/users/profiles").get());
            snapshot === null || snapshot === void 0 ? void 0 : snapshot.forEach((doc) => {
                individualData.set(doc.id, doc.data());
            });
            const pairs = yield (yield ((_b = this.bot.managers.firestore.firestore) === null || _b === void 0 ? void 0 : _b.collection("points_system").doc("pairs").get())).data();
            switch (type) {
                case 'mentee':
                    res = Object.keys(pairs).map(mentee => ({
                        users: [mentee],
                        points: individualData.get(mentee).points || 0
                    }));
                    break;
                case 'mentor':
                    for (const mentor of Object.values(pairs)) {
                        if (!res.find(data => data.users[0] === mentor)) {
                            res.push({
                                users: [mentor],
                                points: individualData.get(mentor).points || 0
                            });
                        }
                    }
                    for (const [mentee, mentor] of Object.entries(pairs)) {
                        let mentorData = res.find(data => data.users[0] === mentor);
                        const activities = individualData.get(mentee).activities;
                        mentorData.points == activities && activities['Mentor/ Mentee Meeting'] ? activities['Mentor/ Mentee Meeting'] : 0;
                    }
                    break;
                case 'both':
                    res = Object.entries(pairs).map(([mentee, mentor]) => {
                        const menteeData = individualData.get(mentee);
                        const mentorData = individualData.get(mentor);
                        return {
                            users: [mentee, mentor],
                            points: ((menteeData === null || menteeData === void 0 ? void 0 : menteeData.points) || 0) + ((mentorData === null || mentorData === void 0 ? void 0 : mentorData.points) || 0)
                        };
                    });
                    break;
            }
            res.sort((a, b) => b.points - a.points);
            return limit > 0 ? res.slice(0, limit) : res;
        });
    }
}
exports.default = PointsManager;
