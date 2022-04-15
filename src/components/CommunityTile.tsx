import React, { ReactElement } from 'react';
import RX from 'reactxp';
import ApiClient from '../matrix/ApiClient';
import { TILE_BACKGROUND, TILE_SYSTEM_TEXT, BORDER_RADIUS, AVATAR_WIDTH, FONT_LARGE, FONT_NORMAL, TILE_WIDTH, SPACING,
    TILE_HEIGHT_COMMUNITY, AVATAR_FOREGROUND } from '../ui';
import UiStore from '../stores/UiStore';
import { alias, topic, members } from '../translations';
import IconSvg, { SvgFile } from './IconSvg';
import { PublicRoom_ } from '../models/MatrixApi';
import AppFont from '../modules/AppFont';
import StringUtils from '../utils/StringUtils';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        height: TILE_HEIGHT_COMMUNITY,
        width: TILE_WIDTH,
        marginBottom: SPACING,
        borderRadius: BORDER_RADIUS,
        backgroundColor: TILE_BACKGROUND,
        alignItems: 'center',
        padding: SPACING,
        cursor: 'pointer',
    }),
    containerAvatar: RX.Styles.createViewStyle({
        justifyContent: 'center',
        alignItems: 'center',
        height: AVATAR_WIDTH,
        width: AVATAR_WIDTH,
        borderRadius: AVATAR_WIDTH / 2,
        marginRight: 8,
    }),
    avatar: RX.Styles.createImageStyle({
        flex: 1,
        width: AVATAR_WIDTH,
        borderRadius: AVATAR_WIDTH / 2,
    }),
    containerRoomInfo: RX.Styles.createViewStyle({
        flex: 1,
    }),
    roomInfo: RX.Styles.createViewStyle({
        flex: 1,
        flexDirection: 'row',
    }),
    label: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flex: 1,
        fontSize: FONT_NORMAL,
        color: TILE_SYSTEM_TEXT,
        marginRight: 3,
    }),
    roomName: RX.Styles.createTextStyle({
        fontFamily: AppFont.fontFamily,
        flex: 1,
        fontSize: FONT_LARGE,
        fontWeight: 'bold',
        marginBottom: SPACING,
        color: TILE_SYSTEM_TEXT,
    }),
}

interface CommunityTileProps {
    roomResponse: PublicRoom_;
    server: string;
    askJoinRoom: (roomId: string, roomName: string) => void;
}

export default class CommunityTile extends RX.Component<CommunityTileProps, RX.Stateless> {

    private onTileClick = (event: RX.Types.SyntheticEvent) => {

        event.stopPropagation();

        if (this.props.askJoinRoom) {
            this.props.askJoinRoom(this.props.roomResponse.room_id, this.props.roomResponse.name);
        }
    }

    public render(): JSX.Element | null {

        const avatarUrl = StringUtils.mxcToHttp(this.props.roomResponse.avatar_url, ApiClient.credentials.homeServer);

        const avatarIsUrl = avatarUrl && avatarUrl.includes('https');

        let avatar: ReactElement;
        if (!avatarIsUrl) {
            avatar = (
                <IconSvg
                    source= { require('../resources/svg/community.json') as SvgFile }
                    fillColor={ AVATAR_FOREGROUND }
                    height={ AVATAR_WIDTH * 0.6 }
                    width={ AVATAR_WIDTH * 0.6 }
                />
            )
        } else {
            avatar = (
                <RX.Image
                    resizeMode={ 'cover' }
                    style={ styles.avatar }
                    source={ avatarUrl }
                />
            )
        }

        const language = UiStore.getLanguage();

        return (
            <RX.View
                style={ styles.container }
                onPress={ event => this.onTileClick(event) }
                disableTouchOpacityAnimation={ false }
                activeOpacity={ 0.8 }
            >
                <RX.View style={ styles.containerAvatar }>
                    { avatar }
                </RX.View>
                <RX.View style={ styles.containerRoomInfo }>
                    <RX.View style={ styles.roomInfo }>
                        <RX.Text allowFontScaling={ false } numberOfLines={ 1 } style={ styles.roomName }>
                            { this.props.roomResponse.name || this.props.roomResponse.canonical_alias }
                        </RX.Text>
                    </RX.View>
                    <RX.View style={ styles.roomInfo } title={ this.props.roomResponse.canonical_alias }>
                        <RX.Text allowFontScaling={ false } numberOfLines={ 1 } style={ styles.label }>
                            { alias[language] + ': ' + (this.props.roomResponse.canonical_alias || '-') }
                        </RX.Text>
                    </RX.View>
                    <RX.View style={ styles.roomInfo }>
                        <RX.Text allowFontScaling={ false } numberOfLines={ 1 } style={ styles.label }>
                            {
                                topic[language] + ': ' +
                                (this.props.roomResponse.topic ? this.props.roomResponse.topic.replace(/\n|\s{2,}/g, ' ') : '-')
                            }
                        </RX.Text>
                    </RX.View>
                    <RX.View style={ styles.roomInfo }>
                        <RX.Text allowFontScaling={ false } numberOfLines={ 1 } style={ styles.label }>
                            { members[language] + ': ' + this.props.roomResponse.num_joined_members }
                        </RX.Text>
                    </RX.View>
                </RX.View>
            </RX.View>
        )
    }
}
