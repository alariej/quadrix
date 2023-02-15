import React from 'react';
import RX from 'reactxp';
import {
	BORDER_RADIUS,
	BUTTON_FILL,
	BUTTON_JITSI_BACKGROUND,
	BUTTON_ROUND_WIDTH,
	JITSI_BORDER,
	OPAQUE_BACKGROUND,
	PAGE_MARGIN,
	SPACING,
	TRANSPARENT_BACKGROUND,
} from '../../ui';
import ApiClient from '../../matrix/ApiClient';
import UiStore from '../../stores/UiStore';
import { ELEMENT_CALL_URL } from '../../appconfig';
import IconSvg, { SvgFile } from '../../components/IconSvg';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'center',
		backgroundColor: OPAQUE_BACKGROUND,
	}),
	containerMinimized: RX.Styles.createViewStyle({
		position: 'absolute',
		bottom: PAGE_MARGIN + SPACING,
		right: PAGE_MARGIN + SPACING,
		width: 80,
		height: 100,
		backgroundColor: TRANSPARENT_BACKGROUND,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: BORDER_RADIUS,
		borderWidth: 1,
		borderColor: JITSI_BORDER,
		overflow: 'hidden',
	}),
	callContainer: RX.Styles.createViewStyle({
		flex: 1,
		margin: 32, // 12,
	}),
	callContainerMinimized: RX.Styles.createViewStyle({
		width: 80,
		height: 100,
	}),
	buttonMinimize: RX.Styles.createViewStyle({
		position: 'absolute',
		left: 2 * SPACING,
		top: 2 * SPACING,
		width: BUTTON_ROUND_WIDTH,
		height: BUTTON_ROUND_WIDTH,
	}),
	buttonMaximize: RX.Styles.createViewStyle({
		position: 'absolute',
		width: 80,
		height: 100,
		backgroundColor: BUTTON_JITSI_BACKGROUND,
	}),
	containerIcon: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	}),
};

interface ElementCallProps {
	roomId: string;
}

interface ElementCallState {
	url: string;
	isMinimized: boolean;
}

export default class ElementCall extends RX.Component<ElementCallProps, ElementCallState> {
	constructor(props: ElementCallProps) {
		super(props);

		this.state = {
			url: '',
			isMinimized: false,
		};
	}

	public async componentDidMount(): Promise<void> {
		RX.Modal.dismiss('dialog_menu_composer');

		const params = new URLSearchParams({
			embed: 'true',
			hideHeader: 'true',
			hideScreensharing: 'true',
			roomId: this.props.roomId,
			enableE2e: 'false',
			lang: UiStore.getLanguage(),
		});

		const wellKnown = await ApiClient.getWellKnown(ApiClient.credentials.homeServer).catch(_error => undefined);
		const preferredDomain = wellKnown ? wellKnown['chat.quadrix.elementcall']?.preferredDomain : undefined;
		const elementCallUrl = preferredDomain ? 'https://' + preferredDomain : ELEMENT_CALL_URL;

		const url = elementCallUrl + '/room/?' + params.toString();

		this.setState({ url: url });
	}

	public componentWillUnmount(): void {
		// do something
	}

	private setMinimized = (isMinimized: boolean) => {
		this.setState({ isMinimized: isMinimized });
	};

	private onMessage = (message: WebViewMessageEvent) => {
		console.log('-------------------ONMESSAGE');
		console.log(message);
	};

	public render(): JSX.Element | null {
		if (!this.state.url) {
			return null;
		}

		let buttonMinimize;
		let buttonMaximize;

		if (this.state.isMinimized) {
			buttonMinimize = null;

			buttonMaximize = (
				<RX.Button
					style={styles.buttonMaximize}
					onPress={() => this.setMinimized(false)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				></RX.Button>
			);
		} else {
			buttonMaximize = null;

			buttonMinimize = (
				<RX.Button
					style={styles.buttonMinimize}
					onPress={() => this.setMinimized(true)}
					disableTouchOpacityAnimation={true}
					activeOpacity={1}
				>
					<RX.View style={styles.containerIcon}>
						<IconSvg
							source={require('../../resources/svg/RI_arrowdown.json') as SvgFile}
							fillColor={BUTTON_FILL}
							height={BUTTON_ROUND_WIDTH}
							width={BUTTON_ROUND_WIDTH}
						/>
					</RX.View>
				</RX.Button>
			);
		}

		const session = {
			user_id: ApiClient.credentials.userIdFull,
			device_id: ApiClient.credentials.deviceId,
			access_token: ApiClient.credentials.accessToken,
			passwordlessUser: false,
		};

		const session_ = JSON.stringify(session);

		const injectedJavaScript = `
			window.isNativeApp = true;
			window.sessionStorage.setItem("matrix-auth-store", ${session_});
			setTimeout(() => { window.location.reload(); }, 5000);
			true; // required
		`;

		return (
			<RX.View
				style={this.state.isMinimized ? styles.containerMinimized : styles.container}
				onLongPress={() => RX.Modal.dismiss('element_call')}
			>
				<RX.View style={this.state.isMinimized ? styles.callContainerMinimized : styles.callContainer}>
					<WebView
						style={{
							height: '100%',
							width: '100%',
							borderWidth: 0,
							borderRadius: BORDER_RADIUS,
						}}
						scrollEnabled={false}
						originWhitelist={['*']}
						source={{
							uri: this.state.url,
						}}
						onMessage={this.onMessage}
						mediaPlaybackRequiresUserAction={false}
						allowsInlineMediaPlayback={true}
						javaScriptEnabled={true}
						injectedJavaScript={injectedJavaScript}
					/>
					{buttonMinimize}
				</RX.View>
				{buttonMaximize}
			</RX.View>
		);
	}
}
