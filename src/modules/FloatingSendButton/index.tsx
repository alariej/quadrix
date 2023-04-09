import RX from 'reactxp';
import { Component } from 'react';

interface FloatingSendButtonProps {
	offline: boolean;
	onPressSendButton: ((e: RX.Types.SyntheticEvent) => void) | undefined;
}

interface FloatingSendButtonState {
	keyboardHeight: number;
}

export default class FloatingSendButton extends Component<FloatingSendButtonProps, FloatingSendButtonState> {
	public render(): JSX.Element | null {
		return null;
	}
}
