import { NativeModules } from 'react-native';

class Locale {
	public async getLocale(): Promise<string> {
		const locale: string =  // eslint-disable-line
			(await NativeModules.SettingsManager.settings.AppleLocale) ||  // eslint-disable-line
			(await NativeModules.SettingsManager.settings.AppleLanguages[0]) ||  // eslint-disable-line
			'en';

		return locale;
	}
}

export default new Locale();
