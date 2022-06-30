import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	BUTTON_MODAL_TEXT,
	BUTTON_MODAL_BACKGROUND,
	MODAL_CONTENT_BACKGROUND,
	OPAQUE_BACKGROUND,
	MODAL_DISABLED_TEXT,
	BORDER_RADIUS,
	BUTTON_HEIGHT,
	FONT_LARGE,
	DIALOG_WIDTH,
	SPACING,
	OBJECT_MARGIN,
	BUTTON_DISABLED_TEXT,
	BUTTON_CANCEL_BACKGROUND,
	BUTTON_LONG_TEXT,
} from '../../ui';
import UiStore from '../../stores/UiStore';
import { cancel } from '../../translations';
import { KeyboardAvoidingView } from 'react-native';
import AppFont from '../../modules/AppFont';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		alignItems: 'center',
		paddingTop: 16, // voodoo 16 must be added here!
	}),
	keyboardAwareView: RX.Styles.createViewStyle({
		flex: 1,
		justifyContent: 'center',
		paddingBottom: SPACING,
	}),
	animatedView: RX.Styles.createViewStyle({
		flex: 0,
		width: DIALOG_WIDTH,
		marginBottom: SPACING + 8, // voodoo 8 must be added here!
	}),
	contentContainer: RX.Styles.createViewStyle({
		flex: 1,
		borderRadius: BORDER_RADIUS,
	}),
	scrollView: RX.Styles.createViewStyle({
		flex: 1,
	}),
	bottomContainer: RX.Styles.createViewStyle({
		flex: 0,
		marginTop: OBJECT_MARGIN,
	}),
	buttonContainer: RX.Styles.createViewStyle({
		flexDirection: 'row',
	}),
	buttonConfirm: RX.Styles.createViewStyle({
		width: DIALOG_WIDTH / 2 - OBJECT_MARGIN / 2,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
	}),
	buttonCancel: RX.Styles.createViewStyle({
		width: DIALOG_WIDTH / 2 - OBJECT_MARGIN / 2,
		height: BUTTON_HEIGHT,
		borderRadius: BUTTON_HEIGHT / 2,
		backgroundColor: BUTTON_CANCEL_BACKGROUND,
	}),
	buttonTextConfirm: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		marginVertical: SPACING,
		textAlign: 'center',
		color: BUTTON_MODAL_TEXT,
	}),
	buttonTextCancel: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		marginVertical: SPACING,
		textAlign: 'center',
		color: BUTTON_LONG_TEXT,
	}),
	bottomElement: RX.Styles.createViewStyle({
		alignItems: 'center',
		marginTop: OBJECT_MARGIN,
	}),
};

interface DialogContainerProps {
	content: ReactElement;
	confirmButton?: boolean;
	confirmButtonText?: string;
	cancelButton?: boolean;
	cancelButtonText?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
	modalId?: string;
	confirmDisabled?: boolean;
	backgroundColor?: string;
	backgroundColorContent?: string;
	scrollEnabled?: boolean;
	bottomElement?: ReactElement;
	buttonStyle?: RX.Types.ButtonStyleRuleSet;
	buttonTextStyle?: RX.Types.TextStyleRuleSet;
}

export default class DialogContainer extends RX.Component<DialogContainerProps, RX.Stateless> {
	private animatedValue: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private dialogHeight = 0;

	constructor(props: DialogContainerProps) {
		super(props);

		this.animatedValue = RX.Animated.createValue(0.9);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [{ scale: this.animatedValue }],
		});
	}

	public componentDidMount(): void {
		RX.Animated.timing(this.animatedValue, {
			duration: 150,
			toValue: 1,
			easing: RX.Animated.Easing.InOut(),
			useNativeDriver: true,
		}).start();
	}

	private onConfirmButtonClick = () => {
		this.props.onConfirm!();
	};

	private onCancelButtonClick = () => {
		this.props.onCancel!();
	};

	private onPressOutside = () => {
		const screenHeight = UiStore.getAppLayout_().screenHeight;

		if (screenHeight - this.dialogHeight > 50) {
			RX.UserInterface.dismissKeyboard();
		}

		if (!this.props.cancelButton) {
			if (this.props.modalId) {
				RX.Modal.dismiss(this.props.modalId);
			} else {
				RX.Modal.dismissAll();
			}
		}
	};

	public render(): JSX.Element | null {
		let disabledStyle;
		if (this.props.confirmDisabled) {
			disabledStyle = RX.Styles.createTextStyle(
				{
					color: MODAL_DISABLED_TEXT,
				},
				false
			);
		}

		let confirmButton: ReactElement | undefined = undefined;
		if (this.props.confirmButton) {
			confirmButton = (
				<RX.Button
					style={styles.buttonConfirm}
					onPress={this.onConfirmButtonClick}
					disabledOpacity={1}
					disableTouchOpacityAnimation={false}
					underlayColor={BUTTON_DISABLED_TEXT}
					activeOpacity={0.8}
					disabled={this.props.confirmDisabled}
				>
					<RX.Text
						allowFontScaling={false}
						style={[styles.buttonTextConfirm, disabledStyle]}
					>
						{this.props.confirmButtonText || 'OK'}
					</RX.Text>
				</RX.Button>
			);
		}

		let cancelButton: ReactElement | undefined = undefined;
		if (this.props.cancelButton) {
			cancelButton = (
				<RX.Button
					style={this.props.buttonStyle || styles.buttonCancel}
					onPress={this.onCancelButtonClick}
					disableTouchOpacityAnimation={false}
					underlayColor={BUTTON_DISABLED_TEXT}
					activeOpacity={0.8}
				>
					<RX.Text
						allowFontScaling={false}
						style={this.props.buttonTextStyle || styles.buttonTextCancel}
					>
						{this.props.cancelButtonText || cancel[UiStore.getLanguage()]}
					</RX.Text>
				</RX.Button>
			);
		}

		return (
			<RX.View
				style={[styles.container, { backgroundColor: this.props.backgroundColor || OPAQUE_BACKGROUND }]}
				onPress={this.onPressOutside}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
				useSafeInsets={true}
			>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={'padding'}
				>
					<RX.View
						style={styles.keyboardAwareView}
						onLayout={layout => {
							this.dialogHeight = layout.height;
						}}
					>
						<RX.Animated.View
							style={[styles.animatedView, this.animatedStyle]}
							onPress={(event: RX.Types.SyntheticEvent) => event.stopPropagation()}
							disableTouchOpacityAnimation={true}
							activeOpacity={1}
						>
							<RX.ScrollView
								style={styles.scrollView}
								showsVerticalScrollIndicator={true}
								keyboardShouldPersistTaps={'always'}
								scrollEnabled={this.props.scrollEnabled || false}
							>
								<RX.View
									style={[
										styles.contentContainer,
										{
											backgroundColor:
												this.props.backgroundColorContent || MODAL_CONTENT_BACKGROUND,
										},
									]}
								>
									{this.props.content}
								</RX.View>
							</RX.ScrollView>
							<RX.View style={styles.bottomContainer}>
								<RX.View
									style={[
										styles.buttonContainer,
										{
											justifyContent:
												this.props.cancelButton && this.props.confirmButton
													? 'space-between'
													: 'center',
										},
									]}
								>
									{confirmButton}
									{cancelButton}
								</RX.View>
								<RX.View style={styles.bottomElement}>{this.props.bottomElement}</RX.View>
							</RX.View>
						</RX.Animated.View>
					</RX.View>
				</KeyboardAvoidingView>
			</RX.View>
		);
	}
}
