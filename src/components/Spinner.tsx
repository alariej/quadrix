import React from 'react';
import RX from 'reactxp';
import { MIN_MS, SPINNER_FILL } from '../ui';
import { ReactElement } from 'react';
import AnimatedSpinner from '../components/AnimatedSpinner';

interface SpinnerProps {
	color?: string;
	size?: 'large' | 'small';
	isVisible: boolean;
}

interface SpinnerState {
	isVisible: boolean;
}

export default class Spinner extends RX.Component<SpinnerProps, SpinnerState> {
	private d0: Date;
	private isMounted_: boolean | undefined;

	constructor(props: SpinnerProps) {
		super(props);

		this.d0 = new Date();

		this.state = { isVisible: props.isVisible };
	}

	public componentDidMount(): void {
		this.isMounted_ = true;
	}

	public componentWillUnmount(): void {
		this.isMounted_ = false;
	}

	public componentDidUpdate(prevProps: SpinnerProps): boolean {
		if (!prevProps.isVisible && this.props.isVisible) {
			this.d0 = new Date();
			this.setState({ isVisible: true });
		} else if (prevProps.isVisible && !this.props.isVisible) {
			const d1 = new Date();
			const t = d1.getTime() - this.d0.getTime();

			if (t > MIN_MS) {
				this.setState({ isVisible: false });
			} else {
				setTimeout(() => {
					if (this.isMounted_) {
						this.setState({ isVisible: false });
					}
				}, MIN_MS - t);
			}
		}

		return true;
	}

	public render(): JSX.Element | null {
		const size = !this.props.size || this.props.size === 'large' ? 48 : 14;

		let spinner: ReactElement | null;
		if (this.state.isVisible) {
			spinner = (
				<AnimatedSpinner
					color={this.props.color || SPINNER_FILL}
					size={size}
				/>
			);
		}

		return <RX.View>{spinner!}</RX.View>;
	}
}
