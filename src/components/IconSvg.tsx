import React, { ReactElement } from 'react';
import RX from 'reactxp';
import Svg, { SvgPath } from '../modules/Svg';

interface IconSvgProps {
	source: SvgFile;
	style?: RX.Types.StyleRuleSet<RX.Types.ViewStyle>;
	fillColor: Array<string> | string;
	width: number;
	height: number;
}

export default class IconSvg extends RX.Component<IconSvgProps, RX.Stateless> {
	public render(): JSX.Element {
		const svgPaths: Array<ReactElement> = [];

		this.props.source.paths.map((path: string, i: number) => {
			const svgPath = (
				<SvgPath
					key={i}
					fillColor={Array.isArray(this.props.fillColor) ? this.props.fillColor[i] : this.props.fillColor}
					d={path}
				/>
			);
			svgPaths.push(svgPath);
		});

		return (
			<Svg
				viewBox={this.props.source.viewBox}
				width={this.props.width}
				height={this.props.height}
				style={this.props.style}
			>
				{svgPaths}
			</Svg>
		);
	}
}

export type SvgFile = { paths: string[]; viewBox: string };
