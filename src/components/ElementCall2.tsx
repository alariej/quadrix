// https://call.al4.re/room/#?roomId=!tXOMoNQxlfzHWswSrI:al4.re&hideHeader&embed&hideScreensharing&displayName=XYZ

import React from 'react';
import RX from 'reactxp';
import { ELEMENT_CALL_URL } from '../appconfig';
import ApiClient from '../matrix/ApiClient';
import UiStore from '../stores/UiStore';
import { BORDER_RADIUS } from '../ui';

const styles = {
	modalView: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		justifyContent: 'flex-end',
		// backgroundColor: OPAQUE_BACKGROUND,
	}),
	closeButton: RX.Styles.createButtonStyle({
		position: 'absolute',
		width: 20,
		height: 20,
		bottom: 0,
		right: 0,
		backgroundColor: 'red',
		cursor: 'pointer',
	}),
};

interface ElementCallProps {
	roomId: string;
}

interface ElementCallState {
	url: URL | undefined;
}

export default class ElementCall2 extends RX.Component<ElementCallProps, ElementCallState> {
	private iframe: React.RefObject<HTMLIFrameElement> = React.createRef();

	constructor(props: ElementCallProps) {
		super(props);

		console.log('---------------------CONSTRUCTOR');
		console.log(props);
		/* 
		const session = {
			user_id: ApiClient.credentials.userIdFull,
			device_id: ApiClient.credentials.deviceId,
			access_token: ApiClient.credentials.accessToken,
			passwordlessUser: false,
		};
		localStorage.setItem('matrix-auth-store', JSON.stringify(session));
 */
		this.state = { url: undefined };
	}

	public async componentDidMount(): Promise<void> {
		RX.Modal.dismiss('dialog_menu_composer');

		console.log('---------------------COMPONENTDIDMOUNT');

		const params = new URLSearchParams({
			embed: 'true', // without this, element call starts in the lobby
			// preload: 'true', // what does this do?
			hideHeader: 'true',
			hideScreensharing: 'true',
			// userId: ApiClient.credentials.userIdFull,
			// deviceId: ApiClient.credentials.deviceId,
			roomId: this.props.roomId,
			// baseUrl: 'https://' + ApiClient.credentials.homeServer,
			// enableE2e: 'false',
			lang: UiStore.getLanguage(),
		});

		// here we get the well-known based on the homeserver of the user
		// wouldn't it be better to get the well-known based on the homeserver of the room?
		// for example, alice is on matrix.org and bob is on mozilla.org
		// they have a dm chat hosted on matrix.org (i.e. roomid is 12345xyz:matrix.org)
		// the element call instance when any of them starts a call should probably be matrix.org
		// instead of being mozilla.org if bob initiates the call
		const wellKnown = await ApiClient.getWellKnown(ApiClient.credentials.homeServer).catch(_error => undefined);
		const preferredDomain = wellKnown ? wellKnown['chat.quadrix.elementcall']?.preferredDomain : undefined;
		const elementCallUrl = preferredDomain ? 'https://' + preferredDomain : ELEMENT_CALL_URL;

		console.log(elementCallUrl);

		// const url = new URL('https://call.al4.re');
		// const url = new URL('https://call.element.io');
		// const url = new URL('https://element-call.netlify.app/');
		const url = new URL(elementCallUrl);
		url.pathname = '/room';
		url.hash = `#?${params.toString()}`;

		this.setState({ url: url });
	}

	public componentWillUnmount(): void {
		// do something?
	}

	private onPressCloseButton = () => {
		RX.Modal.dismiss('element_call');
	};

	private onLoad = () => {
		// not used
		console.log('---------------------ONLOAD');
		console.log(this.iframe);
		console.log(this.iframe.current?.contentWindow);
		console.log(this.iframe.current?.contentDocument);
		console.log(this.iframe.current?.contentWindow?.location);
		// console.log(this.iframe.current?.contentWindow?.localStorage.length)

		this.iframe.current?.contentWindow?.postMessage('hello', '*');
		/* 
		setTimeout(() => {
			console.log('---------------------RELOAD');
			this.iframe.current?.contentWindow?.location.reload();
		}, 1000);
*/
		/* 
		const session = {
			user_id: ApiClient.credentials.userIdFull,
			device_id: ApiClient.credentials.deviceId,
			access_token: ApiClient.credentials.accessToken,
			passwordlessUser: false,
		};
		this.iframe.current?.contentWindow?.localStorage.setItem('matrix-auth-store', JSON.stringify(session));
 */
	};

	public render(): JSX.Element | null {
		if (!this.state.url) {
			return null;
		}

		const stringUrl = this.state?.url?.toString().replace(/%24/g, '$');

		const iframeRatio = 2; // 1;
		const height = 260; // 220;
		const width = height * iframeRatio;

		return (
			<RX.View style={styles.modalView}>
				<RX.View style={{ margin: 20 }}>
					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<iframe
							// style={{ display: 'none' }}
							style={{ height: height, width: width, borderWidth: 0, borderRadius: BORDER_RADIUS }}
							src={stringUrl}
							ref={this.iframe}
							// sandbox={'allow-forms allow-scripts allow-same-origin'}
							onLoad={this.onLoad}
							allow={'camera;microphone'}
							allowFullScreen={true}
						/>
					</div>
					<RX.View
						style={styles.closeButton}
						onPress={this.onPressCloseButton}
						disableTouchOpacityAnimation={true}
						activeOpacity={1}
					/>
				</RX.View>
			</RX.View>
		);
	}
}
