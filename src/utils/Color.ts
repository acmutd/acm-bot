import * as colorChecker from 'css-color-checker';

export default class CheckerUtils {
    static color = colorChecker;
    static isMediaURL(str: string): boolean {
        return false;
    }
}