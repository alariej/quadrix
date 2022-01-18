import React from 'react';
import RX from 'reactxp';
import { BORDER_RADIUS } from '../../ui';

interface VideoProps {
    uri: string;
    id?: string;
}

export default class Video extends RX.Component<VideoProps, RX.Stateless> {

    public render(): JSX.Element {

        return (
            <video id={ this.props.id } style={{ borderRadius: BORDER_RADIUS - 2 }} controls muted>
                <source src={ this.props.uri }/>
            </video>
        );
    }
}
