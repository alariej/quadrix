import * as React from 'react';
import * as RNSvg from 'react-native-svg';
import RX from 'reactxp';

export interface SvgProps {
	height: number;
	width: number;
	viewBox?: string;
	style?: RX.Types.StyleRuleSet<RX.Types.ViewStyle>;
	children: React.ReactNode;
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
					<RNSvg.Svg
						width={this.props.width.toString()}
						height={this.props.height.toString()}
						viewBox={this.props.viewBox}
					>
						{this.props.children}
					</RNSvg.Svg>
				</RX.View>
			);
		}

		return null;
	}
}

export class SvgPath extends RX.Component<SvgPathProps, RX.Stateless> {
	render() {
		return (
			<RNSvg.Path
				fill={this.props.fillColor}
				stroke={this.props.strokeColor}
				strokeWidth={this.props.strokeWidth}
				d={this.props.d}
			/>
		);
	}
}

export default Svg;
