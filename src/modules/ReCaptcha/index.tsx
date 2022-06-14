import React from 'react';
import RX from 'reactxp';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		alignItems: 'center',
		justifyContent: 'center',
	}),
};

interface ReCaptchaProps {
	siteKey: string;
	hideSpinner: () => void;
	onCompleted: (token: string) => void;
}

export default class ReCaptcha extends RX.Component<ReCaptchaProps, RX.Stateless> {
	private onDataCallback = (message: string) => {
		document.head.removeChild(document.getElementById('recaptchaScript')!);

		this.props.onCompleted(message);
	};

	private onDataExpiredCallback = (_message: string) => {
		document.head.removeChild(document.getElementById('recaptchaScript')!);

		this.props.onCompleted('expired');
	};

	private onDataErrorCallback = (_message: string) => {
		document.head.removeChild(document.getElementById('recaptchaScript')!);

		this.props.onCompleted('error');
	};

	public render(): JSX.Element | null {
		const languageCode = 'en';

		const scriptElement = document.createElement('script');
		scriptElement.id = 'recaptchaScript';
		scriptElement.async = true;
		scriptElement.defer = true;
		scriptElement.src = 'https://recaptcha.google.com/recaptcha/api.js?explicit&hl=' + (languageCode || 'en');

		scriptElement.onload = () => {
			this.props.hideSpinner();
		};

		// @ts-ignore
		window['onDataCallback'] = this.onDataCallback;
		// @ts-ignore
		window['onDataExpiredCallback'] = this.onDataExpiredCallback;
		// @ts-ignore
		window['onDataErrorCallback'] = this.onDataErrorCallback;

		document.head.appendChild(scriptElement);

		return (
			<RX.View style={styles.container}>
				<div
					id={'captcha'}
					className={'g-recaptcha'}
					data-sitekey={this.props.siteKey}
					data-callback={'onDataCallback'}
					data-expired-callback={'onDataExpiredCallback'}
					data-error-callback={'onDataErrorCallback'}
				/>
			</RX.View>
		);
	}
}
