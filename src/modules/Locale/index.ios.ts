import { NativeModules } from 'react-native'

class Locale {

    public getLocale(): string {

        const locale: string = NativeModules.SettingsManager.settings.AppleLocale || // eslint-disable-line
            NativeModules.SettingsManager.settings.AppleLanguages[0] || 'en'; // eslint-disable-line

        return locale;
    }
}

export default new Locale();
