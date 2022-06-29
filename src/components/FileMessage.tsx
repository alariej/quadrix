import React, { ReactElement } from 'react';
import RX from 'reactxp';
import {
	LINK_TEXT,
	MODAL_CONTENT_TEXT,
	FONT_LARGE,
	FONT_NORMAL,
	TILE_SYSTEM_TEXT,
	ICON_INFO_FILL,
	ICON_INFO_SIZE,
} from '../ui';
import FileHandler from '../modules/FileHandler';
import { MessageEvent } from '../models/MessageEvent';
import DialogContainer from '../modules/DialogContainer';
import UiStore from '../stores/UiStore';
import { noApplicationWasFound, fileCouldNotAccess } from '../translations';
import { ProgressIndicator } from './ProgressIndicator';
import IconSvg, { SvgFile } from './IconSvg';
import AppFont from '../modules/AppFont';

const styles = {
	containerMessage: RX.Styles.createViewStyle({
		flexDirection: 'row',
		alignItems: 'center',
	}),
	containerText: RX.Styles.createViewStyle({
		flex: 1,
	}),
	link: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		padding: 4,
		alignSelf: 'flex-start',
		cursor: 'pointer',
	}),
	fileName: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_LARGE,
		color: LINK_TEXT,
		textDecorationLine: 'underline',
		wordBreak: 'break-all',
	}),
	fileSize: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		fontSize: FONT_NORMAL,
		color: TILE_SYSTEM_TEXT,
	}),
	lastMessageTypeIcon: RX.Styles.createImageStyle({
		height: 16,
		width: 20,
	}),
	textDialog: RX.Styles.createTextStyle({
		fontFamily: AppFont.fontFamily,
		textAlign: 'center',
		color: MODAL_CONTENT_TEXT,
		fontSize: FONT_LARGE,
		margin: 12,
	}),
	progressContainer: RX.Styles.createViewStyle({
		margin: 2,
	}),
};

interface FileMessageProps {
	message: MessageEvent;
	showContextDialog: () => void;
}

interface FileMessageState {
	linkOpacity: number;
	showProgress: boolean;
	progressValue: number;
}

export default class FileMessage extends RX.Component<FileMessageProps, FileMessageState> {
	constructor(props: FileMessageProps) {
		super(props);

		this.state = {
			linkOpacity: 1,
			showProgress: false,
			progressValue: 0,
		};
	}

	private viewFile = (event: RX.Types.SyntheticEvent) => {
		event.stopPropagation();

		if (this.state.progressValue > 0) {
			return;
		}

		this.setState({ linkOpacity: 0.2, showProgress: true, progressValue: 0 });

		const fetchProgress = (progress: number) => {
			this.setState({ progressValue: progress });
		};

		const onSuccess = (success: boolean) => {
			if (success) {
				this.setState({ linkOpacity: 1, showProgress: false, progressValue: 0 });
			} else {
				const text = (
					<RX.Text style={styles.textDialog}>
						<RX.Text>{fileCouldNotAccess[UiStore.getLanguage()]}</RX.Text>
					</RX.Text>
				);

				RX.Modal.show(<DialogContainer content={text} />, 'errorDialog');
			}
		};

		const onNoAppFound = () => {
			const text = (
				<RX.Text style={styles.textDialog}>
					<RX.Text>{noApplicationWasFound[UiStore.getLanguage()]}</RX.Text>
				</RX.Text>
			);

			RX.Modal.show(<DialogContainer content={text} />, 'warningDialog');
		};

		FileHandler.viewFile(this.props.message, fetchProgress, onSuccess, onNoAppFound);
	};

	public render(): JSX.Element | null {
		let fileSize: string;
		if (this.props.message.content.info!.size! > 1000000) {
			fileSize = Math.round(this.props.message.content.info!.size! / 100000) / 10 + ' MB';
		} else {
			fileSize = Math.round(this.props.message.content.info!.size! / 1000) + ' KB';
		}
		const linkText = (
			<RX.Text style={[styles.link, { opacity: this.state.linkOpacity }]}>
				<RX.Text style={styles.fileName}>{this.props.message.content.body}</RX.Text>
				<RX.Text style={styles.fileSize}>{' (' + fileSize + ')'}</RX.Text>
			</RX.Text>
		);

		let fileIcon: ReactElement | undefined;
		if (this.state.showProgress) {
			fileIcon = (
				<RX.View style={styles.progressContainer}>
					<ProgressIndicator
						strokeColor={ICON_INFO_FILL}
						size={ICON_INFO_SIZE}
						progress={this.state.progressValue % 1}
					/>
				</RX.View>
			);
		} else {
			fileIcon = (
				<IconSvg
					source={require('../resources/svg/RI_file.json') as SvgFile}
					fillColor={ICON_INFO_FILL}
					height={ICON_INFO_SIZE}
					width={ICON_INFO_SIZE}
				/>
			);
		}

		return (
			<RX.View style={styles.containerMessage}>
				<RX.View>{fileIcon}</RX.View>
				<RX.View
					style={styles.containerText}
					onPress={event => this.viewFile(event)}
					onLongPress={() => this.props.showContextDialog()}
					onContextMenu={() => this.props.showContextDialog()}
					disableTouchOpacityAnimation={true}
				>
					{linkText}
				</RX.View>
			</RX.View>
		);
	}
}
