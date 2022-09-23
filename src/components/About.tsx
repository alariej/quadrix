import React from 'react';
import RX from 'reactxp';
import {
	APPSTORES_ANDROID_URL,
	APPSTORES_FLATHUB_URL,
	APPSTORES_IOS_URL,
	APPSTORES_MACOS_URL,
	APPSTORES_WINDOWS_URL,
	APP_VERSION,
	APP_WEBSITE,
	GITHUB_SPONSOR_URL,
	GIT_REPO_URL,
	TERMS_URL,
} from '../appconfig';
import AppFont from '../modules/AppFont';
import Shadow from '../modules/Shadow';
import UiStore from '../stores/UiStore';
import { termsPrivacyLicense } from '../translations';
import { APP_BACKGROUND, FONT_LARGE, FONT_NORMAL, LINK_TEXT, LOGO_FILL, MODAL_CONTENT_TEXT, SPACING } from '../ui';
import IconSvg, { SvgFile } from './IconSvg';

const styles = {
	containerAbout: RX.Styles.createViewStyle({
		padding: SPACING,
		alignItems: 'center',
	}),
	logo: RX.Styles.createViewStyle({
		flex: 1,
		marginVertical: 12,
	}),
	logostore: RX.Styles.createViewStyle({
		flex: 1,
		margin: 5,
	}),
	link: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: LINK_TEXT,
		textDecorationLine: 'underline',
		textAlign: 'center',
		marginVertical: 12,
	}),
	textVersion: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		marginVertical: 12,
	}),
	sponsorText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
	}),
	sponsorButton: RX.Styles.createViewStyle({
		flex: 1,
		height: 24,
		marginVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 24 / 2,
		backgroundColor: APP_BACKGROUND,
		overflow: 'visible',
		shadowOffset: Shadow.medium.offset,
		shadowColor: Shadow.medium.color,
		shadowRadius: Shadow.medium.radius,
		elevation: Shadow.medium.elevation,
		shadowOpacity: Shadow.medium.opacity,
	}),
};

export default class About extends RX.Component<unknown, RX.Stateless> {
	private openUrl = (url: string, event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		if (UiStore.getIsElectron()) {
			const { shell } = window.require('electron');
			shell.openExternal(url).catch(_error => null);
		} else {
			RX.Linking.openUrl(url).catch(_error => null);
		}
	};

	public render(): JSX.Element | null {
		const storeIconSize = 28;
		const storeIconColor = 'grey';
		return (
			<RX.View style={styles.containerAbout}>
				<RX.View style={styles.logo}>
					<IconSvg
						source={require('../resources/svg/logo.json') as SvgFile}
						height={52}
						width={52}
						fillColor={LOGO_FILL}
					/>
				</RX.View>
				<RX.Text
					allowFontScaling={false}
					style={styles.textVersion}
				>
					{'Version: ' + APP_VERSION}
				</RX.Text>
				<RX.Text
					allowFontScaling={false}
					style={styles.link}
					onPress={event => this.openUrl(GIT_REPO_URL, event)}
				>
					{APP_WEBSITE}
				</RX.Text>
				<RX.Text
					allowFontScaling={false}
					style={styles.link}
					onPress={event => this.openUrl(TERMS_URL, event)}
				>
					{termsPrivacyLicense[UiStore.getLanguage()]}
				</RX.Text>
				<RX.Button
					style={styles.sponsorButton}
					onPress={event => this.openUrl(GITHUB_SPONSOR_URL, event)}
				>
					<RX.Text
						allowFontScaling={false}
						style={styles.sponsorText}
					>
						💙 Sponsor
					</RX.Text>
				</RX.Button>
				<RX.View style={{ flexDirection: 'row', marginTop: 12 }}>
					<RX.Button
						style={styles.logostore}
						onPress={event => this.openUrl(APPSTORES_ANDROID_URL, event)}
					>
						<IconSvg
							source={require('../resources/svg/logo_android.json') as SvgFile}
							height={storeIconSize}
							width={storeIconSize}
							fillColor={storeIconColor}
						/>
					</RX.Button>
					<RX.Button
						style={styles.logostore}
						onPress={event => this.openUrl(APPSTORES_IOS_URL, event)}
					>
						<IconSvg
							source={require('../resources/svg/logo_ios.json') as SvgFile}
							height={storeIconSize}
							width={storeIconSize}
							fillColor={storeIconColor}
						/>
					</RX.Button>
					<RX.Button
						style={styles.logostore}
						onPress={event => this.openUrl(APPSTORES_MACOS_URL, event)}
					>
						<IconSvg
							source={require('../resources/svg/logo_macos.json') as SvgFile}
							height={storeIconSize}
							width={storeIconSize}
							fillColor={storeIconColor}
						/>
					</RX.Button>
					<RX.Button
						style={styles.logostore}
						onPress={event => this.openUrl(APPSTORES_WINDOWS_URL, event)}
					>
						<IconSvg
							source={require('../resources/svg/logo_windows.json') as SvgFile}
							height={storeIconSize}
							width={storeIconSize}
							fillColor={storeIconColor}
						/>
					</RX.Button>
					<RX.Button
						style={styles.logostore}
						onPress={event => this.openUrl(APPSTORES_FLATHUB_URL, event)}
					>
						<IconSvg
							source={require('../resources/svg/logo_linux.json') as SvgFile}
							height={storeIconSize}
							width={storeIconSize}
							fillColor={storeIconColor}
						/>
					</RX.Button>
				</RX.View>
			</RX.View>
		);
	}
}
