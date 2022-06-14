import RX from 'reactxp';
import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { PAGE_MARGIN, TRANSPARENT_BACKGROUND } from '../../ui';
import { APP_WEBSITE_URL } from '../../appconfig';
import UiStore from '../../stores/UiStore';

interface ReCaptchaProps {
	siteKey: string;
	hideSpinner: () => void;
	onCompleted: (token: string) => void;
}

export default class ReCaptcha extends Component<ReCaptchaProps, RX.Stateless> {
	private onMessage_ = (response: WebViewMessageEvent) => {
		this.props.onCompleted(response.nativeEvent.data);
	};

	public render(): JSX.Element | null {
		const language = UiStore.getLanguage();

		const url = APP_WEBSITE_URL;

		const html = `
            <!DOCTYPE html>
            <html style="height: 100%">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <script src="https://recaptcha.google.com/recaptcha/api.js?explicit&hl=${language}"></script>
                    <script type="text/javascript">
                        var onDataCallback = function(response) {
                            window.ReactNativeWebView.postMessage(response);
                        };
                        var onDataExpiredCallback = function(error) {
                            window.ReactNativeWebView.postMessage("expired");
                        };
                        var onDataErrorCallback = function(error) {
                            window.ReactNativeWebView.postMessage("error");
                        };
                    </script>
                </head>
                <body style="height: 100%; display: flex; justify-content: center; align-items: center">
                    <div
                        id="captcha"
                        class="g-recaptcha"
                        data-sitekey="${this.props.siteKey}"
                        data-callback="onDataCallback"
                        data-expired-callback="onDataExpiredCallback"
                        data-error-callback="onDataErrorCallback"
                    >
                    </div>
                </body>
            </html>
            `;

		return (
			<View
				style={{
					flex: 1,
					alignSelf: 'stretch',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<WebView
					style={{
						width: UiStore.getAppLayout_().pageWidth - PAGE_MARGIN,
						backgroundColor: TRANSPARENT_BACKGROUND,
					}}
					originWhitelist={['*']}
					source={{
						html: html,
						baseUrl: `${url}`,
					}}
					onMessage={this.onMessage_}
					onLoad={this.props.hideSpinner}
				/>
			</View>
		);
	}
}
