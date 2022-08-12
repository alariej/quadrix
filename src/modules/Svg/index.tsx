import * as React from 'react';
import RX from 'reactxp';

interface SvgProps {
	height: number;
	width: number;
	viewBox?: string;
	style?: RX.Types.StyleRuleSet<RX.Types.ViewStyle>;
}

interface SvgPathProps {
	d: string;
	strokeColor?: string;
	strokeWidth?: number;
	fillColor?: string;
}

export class Svg extends RX.Component<SvgProps, RX.Stateless> {
	render() {
		if (this.props.width > 0 && this.props.height > 0) {
			return (
				<RX.View style={this.props.style}>
					<svg
						width={this.props.width}
						height={this.props.height}
						viewBox={this.props.viewBox}
					>
						{this.props.children}
					</svg>
				</RX.View>
			);
		}

		return null;
	}
}

export class SvgPath extends RX.Component<SvgPathProps, RX.Stateless> {
	render() {
		return (
			<path
				fill={this.props.fillColor}
				stroke={this.props.strokeColor}
				strokeWidth={this.props.strokeWidth}
				d={this.props.d}
			/>
		);
	}
}

export default Svg;
