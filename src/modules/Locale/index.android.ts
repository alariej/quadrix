import { NativeModules } from 'react-native'

class Locale {

    public getLocale(): string {

        const locale: string = NativeModules.I18nManager.localeIdentifier; // eslint-disable-line

        return locale;
    }
}

export default new Locale();
