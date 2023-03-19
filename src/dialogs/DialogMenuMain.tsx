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
	BUTTON_MENU_MAIN_WIDTH,
	LIGHT_BACKGROUND,
	HEADER_HEIGHT,
} from '../ui';
import { about, Languages, logout, newRoom, userSettings } from '../translations';
import AppFont from '../modules/AppFont';
import { SvgFile } from '../components/IconSvg';
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
		width: BUTTON_MENU_MAIN_WIDTH,
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
const animatedDuration = 200;
const animatedEasing = RX.Animated.Easing.Out();

interface DialogMenuMainProps {
	layout: LayoutInfo;
	onPressNewChat: () => void;
	onPressSettings: () => void;
	onPressAbout: () => void;
	onPressLogout: () => void;
}

interface DialogMenuMainState {
	offline: boolean;
}

export default class DialogMenuMain extends ComponentBase<DialogMenuMainProps, DialogMenuMainState> {
	private language: Languages = 'en';
	private animatedScale: RX.Animated.Value;
	private animatedOpacity: RX.Animated.Value;
	private animatedTranslateX: RX.Animated.Value;
	private animatedTranslateY: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;
	private animatedStyleOpacity: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: DialogMenuMainProps) {
		super(props);

		this.language = UiStore.getLanguage();

		this.animatedScale = RX.Animated.createValue(animatedSizeStart);
		this.animatedTranslateX = RX.Animated.createValue(BUTTON_MENU_MAIN_WIDTH / 2);
		this.animatedTranslateY = RX.Animated.createValue(-((4 * STACKED_BUTTON_HEIGHT) / 2));
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [
				{ translateX: this.animatedTranslateX },
				{ translateY: this.animatedTranslateY },
				{ scale: this.animatedScale },
			],
		});

		this.animatedOpacity = RX.Animated.createValue(0);
		this.animatedStyleOpacity = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
		});
	}

	protected _buildState(): DialogMenuMainState {
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
			RX.Animated.timing(this.animatedOpacity, {
				duration: animatedDuration,
				toValue: 1,
				easing: animatedEasing,
				useNativeDriver: true,
			}),
		]).start();
	}

	private dismissDialog = () => {
		RX.Modal.dismiss('dialog_menu_main');
	};

	public render(): JSX.Element | null {
		const newChatButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_newchat.json') as SvgFile}
				iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressNewChat}
				disabled={this.state.offline}
				text={newRoom[this.language]}
				textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
			/>
		);

		const settingsButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_settings.json') as SvgFile}
				iconStyle={{ opacity: this.state.offline ? 0.3 : 1 }}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressSettings}
				disabled={this.state.offline}
				text={userSettings[this.language]}
				textStyle={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
			/>
		);

		const aboutButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_info.json') as SvgFile}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressAbout}
				text={about[this.language]}
				textStyle={styles.buttonText}
			/>
		);

		const logoutButton = (
			<AnimatedButton
				buttonStyle={styles.buttonDialog}
				iconSource={require('../resources/svg/RI_power.json') as SvgFile}
				iconFillColor={ICON_INFO_FILL}
				iconHeight={ICON_INFO_SIZE}
				iconWidth={ICON_INFO_SIZE}
				animatedColor={LIGHT_BACKGROUND}
				onPress={this.props.onPressLogout}
				text={logout[this.language]}
				textStyle={styles.buttonText}
			/>
		);

		const appLayout = UiStore.getAppLayout_();

		const right =
			(appLayout.type === 'wide' ? appLayout.screenWidth / 2 + PAGE_WIDE_PADDING : 0) +
			HEADER_HEIGHT / 2 +
			PAGE_MARGIN +
			OBJECT_MARGIN;

		const top = this.props.layout.y + HEADER_HEIGHT / 2 / 2;

		const contextMenu = (
			<RX.Animated.View style={[this.animatedStyle, styles.buttonContainer, { top: top, right: right }]}>
				{newChatButton}
				{settingsButton}
				{aboutButton}
				{logoutButton}
			</RX.Animated.View>
		);

		return (
			<RX.Animated.View
				style={[styles.modalScreen, this.animatedStyleOpacity]}
				onPress={this.dismissDialog}
				disableTouchOpacityAnimation={true}
			>
				{contextMenu}
			</RX.Animated.View>
		);
	}
}
