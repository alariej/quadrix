import React from 'react';
import RX from 'reactxp';
import { APP_BACKGROUND } from '../../ui';

const styles = {
	container: RX.Styles.createViewStyle({
		flex: 1,
		overflow: 'hidden',
	}),
	containerAnimated: RX.Styles.createViewStyle({
		flex: 1,
	}),
};

interface CachedImageProps {
	resizeMode: RX.Types.ImageResizeMode;
	style:
		| RX.Types.StyleRuleSetRecursive<RX.Types.ImageStyleRuleSet>
		| RX.Types.StyleRuleSetRecursive<RX.Types.ImageStyleRuleSet>[];
	source: string;
	onLoad?: (size: RX.Types.Dimensions) => void;
	mimeType?: string;
	animated?: boolean;
}

export default class CachedImage extends RX.Component<CachedImageProps, RX.Stateless> {
	private backgroundColor: string | undefined;
	private animatedOpacity: RX.Animated.Value;
	private animatedStyle: RX.Types.AnimatedViewStyleRuleSet;

	constructor(props: CachedImageProps) {
		super(props);

		this.backgroundColor = this.props.animated && this.props.mimeType === 'image/jpeg' ? APP_BACKGROUND : undefined;

		this.animatedOpacity = RX.Animated.createValue(this.props.animated ? 0 : 1);
		this.animatedStyle = RX.Styles.createAnimatedViewStyle({
			opacity: this.animatedOpacity,
		});
	}

	public componentDidMount(): void {
		if (this.props.animated) {
			RX.Animated.timing(this.animatedOpacity, {
				duration: 500,
				toValue: 1,
				easing: RX.Animated.Easing.Out(),
			}).start();
		}
	}

	private onLoad = (size: RX.Types.Dimensions) => {
		this.props.onLoad ? this.props.onLoad(size) : null;
	};

	public render(): JSX.Element | null {
		return (
			<RX.View style={[styles.container, this.props.style, { backgroundColor: this.backgroundColor }]}>
				<RX.Animated.View style={[styles.containerAnimated, this.animatedStyle]}>
					<RX.Image
						resizeMode={this.props.resizeMode}
						style={{ flex: 1 }}
						source={this.props.source}
						onLoad={this.onLoad}
					/>
				</RX.Animated.View>
			</RX.View>
		);
	}
}
