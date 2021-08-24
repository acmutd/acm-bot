"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = __importDefault(require("../api/event"));
class MessageEvent extends event_1.default {
    constructor(bot) {
        super(bot, "message");
    }
    emit(bot, msg) {
        bot.managers.command.handle(msg);
    }
}
exports.default = MessageEvent;
