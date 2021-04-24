const isURL = require('is-url');
/**
 * Color utility class. Hex/Media support, hardcoded values.
 */
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
    static isHexColor(value?: unknown | null): boolean {
        return (
            typeof value === 'string' &&
            value.match(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i) !== null
        );
    }

    static async isMediaURL(link: string) {
        if (await !isURL(link)) return false;
        if (
            !link.toLowerCase().endsWith('.gif') &&
            !link.toLowerCase().endsWith('.jpg') &&
            !link.toLowerCase().endsWith('.png') &&
            !link.toLowerCase().endsWith('.jpeg') &&
            !link.toLowerCase().endsWith('.gif/') &&
            !link.toLowerCase().endsWith('.jpg/') &&
            !link.toLowerCase().endsWith('.png/') &&
            !link.toLowerCase().endsWith('.jpeg/')
        ) {
            return false;
        }
        return true;
    }
}
