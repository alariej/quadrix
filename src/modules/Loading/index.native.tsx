import React from 'react';
import RX from 'reactxp';
import { LOGO_BACKGROUND, MIN_MS } from '../../ui';
import { ReactElement } from 'react';
import { Wave } from 'react-native-animated-spinkit';

const styles = {
    container: RX.Styles.createViewStyle({
        // not used yet
    }),
}

interface LoadingProps {
    color?: string;
    size?: 'large' | 'small';
    isVisible: boolean;
}

interface LoadingState {
    isVisible: boolean;
}

export default class Loading extends RX.Component<LoadingProps, LoadingState> {

    private d0: Date;
    private isMounted_: boolean | undefined;

    constructor(props: LoadingProps) {
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

    public componentDidUpdate(prevProps: LoadingProps): boolean {

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
                    if (this.isMounted_) { this.setState({ isVisible: false }); }
                }, MIN_MS - t);
            }
        }

        return true;
    }

    public render(): JSX.Element | null {

        const size = !this.props.size || this.props.size === 'large' ? 40 : 14;

        let loading: ReactElement | null;
        if (this.state.isVisible) {
            loading = (
                <Wave
                    color={ this.props.color || LOGO_BACKGROUND }
                    size={ size }
                />
            )
        }

        return (
            <RX.View style={ styles.container }>
                { loading! }
            </RX.View>
        )
    }
}
