import React from 'react';
import RX from 'reactxp';
import { ComponentBase } from 'resub';
import UiStore from '../stores/UiStore';
import {
	OPAQUE_BACKGROUND,
	BUTTON_MODAL_BACKGROUND,
	BUTTON_MODAL_TEXT,
	BORDER_RADIUS,
	STACKED_BUTTON_HEIGHT,
	FONT_LARGE,
	SPACING,
	ICON_INFO_SIZE,
	ICON_INFO_FILL,
	OBJECT_MARGIN,
	PAGE_MARGIN,
	PAGE_WIDE_PADDING,
	BUTTON_COMPOSER_WIDTH,
	BUTTON_MENU_COMPOSER_WIDTH,
	LIGHT_BACKGROUND,
} from '../ui';
import { Languages, sendFile, videoconference } from '../translations';
import AppFont from '../modules/AppFont';
import { SvgFile } from '../components/IconSvg';
import { RoomType } from '../models/MatrixApi';
import AnimatedButton from '../components/AnimatedButton';
import { LayoutInfo } from 'reactxp/dist/common/Types';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_BACKGROUND,
	}),
	buttonContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		flexDirection: 'column',
	}),
	buttonDialog: RX.Styles.createViewStyle({
		flexDirection: 'row',
		alignItems: 'center',
		padding: SPACING,
		borderRadius: BORDER_RADIUS,
		width: BUTTON_MENU_COMPOSER_WIDTH,
		height: STACKED_BUTTON_HEIGHT,
		backgroundColor: BUTTON_MODAL_BACKGROUND,
		marginBottom: 1,
	}),
	buttonText: RX.Styles.createTextStyle({
		flex: 1,
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		margin: SPACING,
		textAlign: 'left',
		color: BUTTON_MODAL_TEXT,
	}),
};

const animatedSizeStart = 0;
const animatedDuration = 500;
const animatedEasing = RX.Animated.Easing.InOutBack();

interface DialogMenuComposerProps {
	layout: LayoutInfo;
	roomType: RoomType;
	roomActive: boolean;
	jitsiActive: boolean;
	onPressFile: () => void;
	onPressVideoCall: () => void;
}

interface DialogMenuComposerState {
	offline: boolean;
}

export default class DialogMenuComposer extends ComponentBase<DialogMenuComposerProps, DialogMenuComposerState> {
	private language: Languages = 'en';
	private animatedScale: RX.Animated.Value;
	private animatedTranslateX: RX.Animated.Value;
	private animatedTranslateY: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: DialogMenuComposerProps) {
		super(props);

		this.language = UiStore.getLanguage();

		this.animatedScale = RX.Animated.createValue(animatedSizeStart);
		this.animatedTranslateX = RX.Animated.createValue(-BUTTON_MENU_COMPOSER_WIDTH / 2);
		this.animatedTranslateY = RX.Animated.createValue(-((2 * STACKED_BUTTON_HEIGHT) / 2));
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [
				{ translateX: this.animatedTranslateX },
				{ translateY: this.animatedTranslateY },
				{ scale: this.animatedScale },
			],
		});
	}

	protected _buildState(): DialogMenuComposerState {
		return { offline: UiStore.getOffline() };
	}

	public componentDidMount(): void {
		super.componentDidMount();
		RX.Animated.parallel([
			RX.Animated.timing(this.animatedScale, {
				duration: animatedDuration,
				toValue: 1,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedTranslateX, {
				duration: animatedDuration,
				toValue: 0,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
			RX.Animated.timing(this.animatedTranslateY, {
				duration: animatedDuration,
				toValue: 0,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
		]).start();
	}

	private dismissDialog = () => {
		RX.Modal.dismiss('dialog_menu_composer');
	};

	public render(): JSX.Element | null {
		const fileButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_attach.json') as SvgFile}
				iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressFile}
				disabled={this.state.offline}
				text={sendFile[this.language]}
				textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
			/>
		);

		const videoCallButtonDisabled =
			this.state.offline ||
			this.props.jitsiActive ||
			['community', 'notepad'].includes(this.props.roomType) ||
			!this.props.roomActive;

		const videoCallButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_videocam.json') as SvgFile}
				iconStyle={{ opacity: videoCallButtonDisabled ? 0.3 : 1 }}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressVideoCall}
				disabled={videoCallButtonDisabled}
				text={videoconference[this.language]}
				textStyle={[styles.buttonText, { opacity: videoCallButtonDisabled ? 0.3 : 1 }]}
			/>
		);

		const appLayout = UiStore.getAppLayout_();

		const left =
			(appLayout.type === 'wide' ? appLayout.screenWidth / 2 + PAGE_WIDE_PADDING : 0) +
			BUTTON_COMPOSER_WIDTH +
			PAGE_MARGIN +
			OBJECT_MARGIN;

		const top = this.props.layout.y + BUTTON_COMPOSER_WIDTH / 2;

		const contextMenu = (
			<RX.Animated.View style={[this.animatedStyle, styles.buttonContainer, { top: top, left: left }]}>
				{fileButton}
				{videoCallButton}
			</RX.Animated.View>
		);

		return (
			<RX.View
				style={styles.modalScreen}
				onPress={this.dismissDialog}
				disableTouchOpacityAnimation={true}
			>
				{contextMenu}
			</RX.View>
		);
	}
}
