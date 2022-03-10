import { NativeModules } from 'react-native'

class Locale {

    public async getLocale(): Promise<string> {

        const locale: string = await NativeModules.I18nManager.localeIdentifier; // eslint-disable-line

        return locale;
    }
}

export default new Locale();
