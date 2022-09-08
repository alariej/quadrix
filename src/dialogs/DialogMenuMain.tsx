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
	OPAQUE_LIGHT_BACKGROUND,
	ICON_INFO_SIZE,
	ICON_INFO_FILL,
	OBJECT_MARGIN,
	PAGE_MARGIN,
	BUTTON_HEADER_WIDTH,
	BUTTON_HEADER_MARGIN,
	PAGE_WIDE_PADDING,
	BUTTON_MENU_MAIN_WIDTH,
} from '../ui';
import { about, Languages, logout, newRoom, userSettings } from '../translations';
import AppFont from '../modules/AppFont';
import IconSvg, { SvgFile } from '../components/IconSvg';

const styles = {
	modalScreen: RX.Styles.createViewStyle({
		flex: 1,
		alignSelf: 'stretch',
		backgroundColor: OPAQUE_BACKGROUND,
	}),
	menu: RX.Styles.createViewStyle({
		position: 'absolute',
		overflow: 'visible',
	}),
	buttonContainer: RX.Styles.createViewStyle({
		position: 'absolute',
		flexDirection: 'column',
		overflow: 'visible',
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
		shadowOffset: { width: -1, height: 1 },
		shadowColor: OPAQUE_LIGHT_BACKGROUND,
		shadowRadius: 3,
		elevation: 3,
		shadowOpacity: 1,
		overflow: 'visible',
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

interface DialogMenuMainProps {
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
	private animatedTranslateX: RX.Animated.Value;
	private animatedTranslateY: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: DialogMenuMainProps) {
		super(props);

		this.language = UiStore.getLanguage();

		this.animatedScale = RX.Animated.createValue(animatedSizeStart);
		this.animatedTranslateX = RX.Animated.createValue(BUTTON_MENU_MAIN_WIDTH / 2);
		this.animatedTranslateY = RX.Animated.createValue(-((4 * STACKED_BUTTON_HEIGHT) / 2));
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			transform: [
				{ translateX: this.animatedTranslateX, translateY: this.animatedTranslateY, scale: this.animatedScale },
			],
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
		]).start();
	}

	private dismissDialog = () => {
		RX.Modal.dismiss('dialog_menu_main');
	};

	public render(): JSX.Element | null {
		const newChatButton = (
			<RX.Button
				style={styles.buttonDialog}
				onPress={this.props.onPressNewChat}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
				disabled={this.state.offline}
				disabledOpacity={1}
			>
				<RX.Text
					allowFontScaling={false}
					style={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
				>
					{newRoom[this.language]}
				</RX.Text>
				<IconSvg
					source={require('../resources/svg/RI_newchat.json') as SvgFile}
					style={{ opacity: this.state.offline ? 0.3 : 1 }}
					fillColor={ICON_INFO_FILL}
					height={ICON_INFO_SIZE}
					width={ICON_INFO_SIZE}
				/>
			</RX.Button>
		);

		const settingsButton = (
			<RX.Button
				style={styles.buttonDialog}
				onPress={this.props.onPressSettings}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
				disabled={this.state.offline}
				disabledOpacity={1}
			>
				<RX.Text
					allowFontScaling={false}
					style={[styles.buttonText, { opacity: this.state.offline ? 0.3 : 1 }]}
				>
					{userSettings[this.language]}
				</RX.Text>
				<IconSvg
					source={require('../resources/svg/RI_settings.json') as SvgFile}
					style={{ opacity: this.state.offline ? 0.3 : 1 }}
					fillColor={ICON_INFO_FILL}
					height={ICON_INFO_SIZE}
					width={ICON_INFO_SIZE}
				/>
			</RX.Button>
		);

		const aboutButton = (
			<RX.Button
				style={styles.buttonDialog}
				onPress={this.props.onPressAbout}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
			>
				<RX.Text
					allowFontScaling={false}
					style={styles.buttonText}
				>
					{about[this.language]}
				</RX.Text>
				<IconSvg
					source={require('../resources/svg/RI_info.json') as SvgFile}
					fillColor={ICON_INFO_FILL}
					height={ICON_INFO_SIZE}
					width={ICON_INFO_SIZE}
				/>
			</RX.Button>
		);

		const logoutButton = (
			<RX.Button
				style={styles.buttonDialog}
				onPress={this.props.onPressLogout}
				disableTouchOpacityAnimation={true}
				activeOpacity={1}
			>
				<RX.Text
					allowFontScaling={false}
					style={styles.buttonText}
				>
					{logout[this.language]}
				</RX.Text>
				<IconSvg
					source={require('../resources/svg/RI_power.json') as SvgFile}
					fillColor={ICON_INFO_FILL}
					height={ICON_INFO_SIZE}
					width={ICON_INFO_SIZE}
				/>
			</RX.Button>
		);

		const appLayout = UiStore.getAppLayout_();

		const right =
			(appLayout.type === 'wide' ? -appLayout.screenWidth / 2 + PAGE_WIDE_PADDING : -appLayout.screenWidth) +
			(BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN) +
			PAGE_MARGIN +
			OBJECT_MARGIN;

		const top = PAGE_MARGIN + (BUTTON_HEADER_WIDTH + BUTTON_HEADER_MARGIN) / 2;

		const contextMenu = (
			<RX.Animated.View style={[this.animatedStyle, styles.buttonContainer, { top: top, right: right }]}>
				{newChatButton}
				{settingsButton}
				{aboutButton}
				{logoutButton}
			</RX.Animated.View>
		);

		return (
			<RX.View
				style={styles.modalScreen}
				onPress={this.dismissDialog}
				disableTouchOpacityAnimation={true}
			>
				<RX.View style={styles.menu}>{contextMenu}</RX.View>
			</RX.View>
		);
	}
}
