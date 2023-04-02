import React from 'react';
import RX from 'reactxp';
import { TILE_BACKGROUND, BORDER_RADIUS, SPACING, FONT_NORMAL, TILE_SYSTEM_TEXT, BUTTON_ROUND_WIDTH } from '../ui';
import AppFont from '../modules/AppFont';

const styles = {
	containerMessage: RX.Styles.createViewStyle({
		flexDirection: 'row',
		marginLeft: (BUTTON_ROUND_WIDTH + SPACING) * 0.5,
		marginRight: (BUTTON_ROUND_WIDTH + SPACING) * 0.5,
		borderRadius: BORDER_RADIUS,
		backgroundColor: TILE_BACKGROUND,
	}),
	containerText: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		flex: 1,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
	}),
};

interface SystemMessageProps {
	systemMessage: string;
	hide: boolean;
}

export default class SystemMessage extends RX.Component<SystemMessageProps, RX.Stateless> {
	public render(): JSX.Element | null {
		return (
			<RX.View
				style={[
					styles.containerMessage,
					{
						height: this.props.hide ? 0 : undefined,
						padding: this.props.hide ? 0 : SPACING,
						marginBottom: this.props.hide ? 0 : SPACING,
					},
				]}
			>
				<RX.Text style={styles.containerText}>{this.props.systemMessage}</RX.Text>
			</RX.View>
		);
	}
}
