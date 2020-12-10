import * as colorChecker from 'css-color-checker';

export default class CheckerUtils {
    static colors = [
        'DEFAULT',
        'WHITE',
        'AQUA',
        'GREEN',
        'BLUE',
        'YELLOW',
        'PURPLE',
        'LUMINOUS_VIVID_PINK',
        'GOLD',
        'ORANGE',
        'RED',
        'GREY',
        'DARKER_GREY',
        'NAVY',
        'DARK_AQUA',
        'DARK_GREEN',
        'DARK_BLUE',
        'DARK_PURPLE',
        'DARK_VIVID_PINK',
        'DARK_GOLD',
        'DARK_ORANGE',
        'DARK_RED',
        'DARK_GREY',
        'LIGHT_GREY',
        'DARK_NAVY',
        'BLURPLE',
        'GREYPLE',
        'DARK_BUT_NOT_BLACK',
        'NOT_QUITE_BLACK',
        'RANDOM',
    ];
    static color = colorChecker;
    static isMediaURL(str: string): boolean {
        return false;
    }
}
