import React from 'react';
import RX from 'reactxp';
import DialogContainer from '../modules/DialogContainer';
import {
	BORDER_RADIUS,
	BUTTON_HEIGHT,
	CHECKBOX_BACKGROUND,
	CONTAINER_PADDING,
	FONT_NORMAL,
	INPUT_BORDER,
	LABEL_TEXT,
	PLACEHOLDER_TEXT,
	SPACING,
} from '../ui';
import AppFont from '../modules/AppFont';
import UiStore from '../stores/UiStore';

const styles = {
	container: RX.Styles.createViewStyle({
		padding: SPACING,
	}),
	rowContainer: RX.Styles.createViewStyle({
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: SPACING,
	}),
	title: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		fontWeight: 'bold',
		color: LABEL_TEXT,
		width: 260 - 2 * SPACING,
		padding: SPACING,
		textAlign: 'center',
	}),
	label: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: LABEL_TEXT,
		width: 260 - BUTTON_HEIGHT - 2 * SPACING,
		padding: SPACING,
	}),
	inputBox: RX.Styles.createTextInputStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		paddingHorizontal: CONTAINER_PADDING,
		height: BUTTON_HEIGHT,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: INPUT_BORDER,
	}),
	textField: RX.Styles.createViewStyle({
		flex: 1,
		height: BUTTON_HEIGHT,
		justifyContent: 'center',
	}),
	emailCheckbox: RX.Styles.createButtonStyle({
		height: BUTTON_HEIGHT,
		width: BUTTON_HEIGHT,
		backgroundColor: CHECKBOX_BACKGROUND,
		borderRadius: BORDER_RADIUS,
	}),
	checkboxText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		alignSelf: 'center',
		fontWeight: 'bold',
		fontSize: 20,
		color: 'limegreen',
	}),
};

interface DialogElementCallUrlProps {
	onPressVideoCall: () => void;
}

interface DialogElementCallUrlState {
	elementCallUrl: string;
}

export default class DialogElementCallUrl extends RX.Component<DialogElementCallUrlProps, DialogElementCallUrlState> {
	private elementCallUrls = [
		'https://call.quadrix.chat',
		'https://call.element.io',
		'https://element-call.netlify.app/',
	];

	constructor(props: DialogElementCallUrlProps) {
		super(props);

		this.state = {
			elementCallUrl: UiStore.getElementCallUrl() || this.elementCallUrls[0],
		};
	}

	private setElementCallUrl = (n: number) => {
		this.setState({ elementCallUrl: this.elementCallUrls[n] });
		UiStore.setElementCallUrl(this.elementCallUrls[n]);
	};

	private setCustomElementCallUrl = (url: string) => {
		this.setState({ elementCallUrl: url });
		UiStore.setElementCallUrl(url);
	};

	public render(): JSX.Element | null {
		const optionsContent = (
			<RX.View style={styles.container}>
				<RX.View style={styles.rowContainer}>
					<RX.Text
						allowFontScaling={false}
						style={styles.title}
					>
						Element Call URL Options
					</RX.Text>
				</RX.View>
				<RX.View style={styles.rowContainer}>
					<RX.Text
						allowFontScaling={false}
						style={styles.label}
					>
						https://call.quadrix.chat
					</RX.Text>
					<RX.View style={styles.textField}>
						<RX.Button
							style={styles.emailCheckbox}
							onPress={() => this.setElementCallUrl(0)}
							disableTouchOpacityAnimation={true}
							activeOpacity={1}
						>
							<RX.Text
								allowFontScaling={false}
								style={styles.checkboxText}
							>
								{this.state.elementCallUrl === this.elementCallUrls[0] ? '✓' : ''}
							</RX.Text>
						</RX.Button>
					</RX.View>
				</RX.View>
				<RX.View style={styles.rowContainer}>
					<RX.Text
						allowFontScaling={false}
						style={styles.label}
					>
						https://call.element.io
					</RX.Text>
					<RX.View style={styles.textField}>
						<RX.Button
							style={styles.emailCheckbox}
							onPress={() => this.setElementCallUrl(1)}
							disableTouchOpacityAnimation={true}
							activeOpacity={1}
						>
							<RX.Text
								allowFontScaling={false}
								style={styles.checkboxText}
							>
								{this.state.elementCallUrl === this.elementCallUrls[1] ? '✓' : ''}
							</RX.Text>
						</RX.Button>
					</RX.View>
				</RX.View>
				<RX.View style={styles.rowContainer}>
					<RX.Text
						allowFontScaling={false}
						style={styles.label}
					>
						https://element-call.netlify.app
					</RX.Text>
					<RX.View style={styles.textField}>
						<RX.Button
							style={styles.emailCheckbox}
							onPress={() => this.setElementCallUrl(2)}
							disableTouchOpacityAnimation={true}
							activeOpacity={1}
						>
							<RX.Text
								allowFontScaling={false}
								style={styles.checkboxText}
							>
								{this.state.elementCallUrl === this.elementCallUrls[2] ? '✓' : ''}
							</RX.Text>
						</RX.Button>
					</RX.View>
				</RX.View>
				<RX.TextInput
					style={styles.inputBox}
					placeholder={'Custom Element Call URL'}
					placeholderTextColor={PLACEHOLDER_TEXT}
					onChangeText={url => this.setCustomElementCallUrl(url)}
					keyboardType={'default'}
					disableFullscreenUI={true}
					allowFontScaling={false}
					autoCapitalize={'sentences'}
					autoCorrect={false}
					autoFocus={true}
					spellCheck={false}
					value={this.elementCallUrls.includes(this.state.elementCallUrl) ? '' : this.state.elementCallUrl}
				/>
			</RX.View>
		);

		return (
			<DialogContainer
				content={optionsContent}
				confirmButton={true}
				confirmButtonText={'OK'}
				cancelButton={true}
				cancelButtonText={'Cancel'}
				onConfirm={this.props.onPressVideoCall}
				onCancel={() => RX.Modal.dismissAll()}
			/>
		);
	}
}
