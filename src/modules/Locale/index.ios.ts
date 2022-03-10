import { NativeModules } from 'react-native'

class Locale {

    public async getLocale(): Promise<string> {

        const locale: string = await NativeModules.SettingsManager.settings.AppleLocale || // eslint-disable-line
            await NativeModules.SettingsManager.settings.AppleLanguages[0] || 'en'; // eslint-disable-line

        return locale;
    }
}

export default new Locale();
