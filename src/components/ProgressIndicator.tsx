import * as React from 'react';
import * as RX from 'reactxp';
import Svg, { SvgPath } from '../modules/Svg';
import { TRANSPARENT_BACKGROUND } from '../ui';

export interface ProgressIndicatorProps {
	strokeColor: string;
	progress: number;
	size: number;
	style?: RX.Types.StyleRuleSet<RX.Types.ViewStyle>;
}

export class ProgressIndicator extends RX.Component<ProgressIndicatorProps, RX.Stateless> {
	private getPath = (): string => {
		const progress = this.props.progress;
		const size = this.props.size;
		const radius = (size - 2) / 2;
		const angle = progress * 360;

		const getCoordinates = (
			centerX: number,
			centerY: number,
			radius: number,
			angle: number
		): { x: number; y: number } => {
			const radians = (Math.PI * (angle - 90)) / 180;

			return {
				x: centerX + radius * Math.cos(radians),
				y: centerY + radius * Math.sin(radians),
			};
		};

		const start = getCoordinates(size / 2, size / 2, radius, angle);
		const end = getCoordinates(size / 2, size / 2, radius, 0);

		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 0 ${end.x} ${end.y}`;
	};

	public render(): JSX.Element | null {
		const size = this.props.size;
		const path = this.getPath();

		return (
			<Svg
				viewBox={'0 0 ' + size + ' ' + size}
				height={size}
				width={size}
				style={this.props.style}
			>
				<SvgPath
					fillColor={TRANSPARENT_BACKGROUND}
					strokeColor={this.props.strokeColor}
					strokeWidth={2}
					d={path}
				/>
			</Svg>
		);
	}
}
