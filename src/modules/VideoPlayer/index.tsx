import React from 'react';
import RX from 'reactxp';
import { BORDER_RADIUS } from '../../ui';

interface VideoPlayerProps {
    uri: string;
    id?: string;
}

export default class VideoPlayer extends RX.Component<VideoPlayerProps, RX.Stateless> {

    public render(): JSX.Element {

        return (
            <video id={ this.props.id } style={{ borderRadius: BORDER_RADIUS - 2 }} controls muted>
                <source src={ this.props.uri }/>
            </video>
        );
    }
}
