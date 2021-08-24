"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_url_1 = __importDefault(require("is-url"));
class CheckerUtils {
    static isHexColor(value) {
        return (typeof value === "string" &&
            value.match(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i) !==
                null);
    }
    static isMediaURL(link) {
        if (!is_url_1.default(link))
            return false;
        if (!link.toLowerCase().endsWith(".gif") &&
            !link.toLowerCase().endsWith(".jpg") &&
            !link.toLowerCase().endsWith(".png") &&
            !link.toLowerCase().endsWith(".jpeg") &&
            !link.toLowerCase().endsWith(".gif/") &&
            !link.toLowerCase().endsWith(".jpg/") &&
            !link.toLowerCase().endsWith(".png/") &&
            !link.toLowerCase().endsWith(".jpeg/")) {
            return false;
        }
        return true;
    }
}
exports.default = CheckerUtils;
CheckerUtils.colors = [
    "DEFAULT",
    "WHITE",
    "AQUA",
    "GREEN",
    "BLUE",
    "YELLOW",
    "PURPLE",
    "LUMINOUS_VIVID_PINK",
    "GOLD",
    "ORANGE",
    "RED",
    "GREY",
    "DARKER_GREY",
    "NAVY",
    "DARK_AQUA",
    "DARK_GREEN",
    "DARK_BLUE",
    "DARK_PURPLE",
    "DARK_VIVID_PINK",
    "DARK_GOLD",
    "DARK_ORANGE",
    "DARK_RED",
    "DARK_GREY",
    "LIGHT_GREY",
    "DARK_NAVY",
    "BLURPLE",
    "GREYPLE",
    "DARK_BUT_NOT_BLACK",
    "NOT_QUITE_BLACK",
    "RANDOM",
];
