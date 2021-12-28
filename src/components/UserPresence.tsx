import React from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import ApiClient from '../matrix/ApiClient';
import { Languages, online, todayWord, yesterdayWord } from '../translations';
import UiStore from '../stores/UiStore';
import { differenceInDays, differenceInMilliseconds, format, isToday, isYesterday } from 'date-fns';
import IconSvg, { SvgFile } from './IconSvg';
import { SPACING } from '../ui';
import AppFont from '../modules/AppFont';

const styles = {
    container: RX.Styles.createViewStyle({
        flexDirection: 'row',
        alignItems: 'center',
    }),
}

interface UserPresenceState {
    lastSeenTime: number;
}

interface UserPresenceProps extends RX.CommonProps {
    userId: string;
    fontColor: string;
    fontSize: number;
}

export default class UserPresence extends ComponentBase<UserPresenceProps, UserPresenceState> {

    private language: Languages = 'en';
    private locale: Locale;
    private isMounted_: boolean | undefined;

    constructor(props: UserPresenceProps) {
        super(props);

        this.language = UiStore.getLanguage();
        this.locale = UiStore.getLocale();
    }

    protected _buildState(nextProps: UserPresenceProps, _initState: boolean, prevState: UserPresenceState): UserPresenceState {

        const prevLastSeenTime = this.props.userId !== nextProps.userId ? 0 : prevState?.lastSeenTime || 0;

        const lastSeenTime = DataStore.getLastSeenTime(nextProps.userId);

        return { lastSeenTime: Math.max(lastSeenTime, prevLastSeenTime) }
    }

    public componentDidMount(): void {
        super.componentDidMount();

        this.isMounted_ = true;

        ApiClient.getPresence(this.props.userId)
            .then(response => {
                if (response?.last_active_ago) {
                    const lastSeenTime = Date.now() - response.last_active_ago;
                    if (this.isMounted_ && lastSeenTime > this.state.lastSeenTime) {
                        this.setState({ lastSeenTime: lastSeenTime });
                    }
                }
            })
            .catch(_error => null);
    }

    public componentWillUnmount(): void {
        this.isMounted_ = false;
    }

    private resetPresence = () => {
        this.forceUpdate();
    }

    public render(): JSX.Element | null {

        let lastSeenText = '';

        if (!this.state.lastSeenTime || this.state.lastSeenTime < 100) {

            lastSeenText = 'N/A';

        } else if (differenceInMilliseconds(new Date(), this.state.lastSeenTime) < 30000) {

            lastSeenText = online[this.language];

            setTimeout(this.resetPresence, 31000);

        } else {

            if (isToday(this.state.lastSeenTime)) {

                lastSeenText = todayWord[this.language] + format(this.state.lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (isYesterday(this.state.lastSeenTime)) {

                lastSeenText = yesterdayWord[this.language] + format(this.state.lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (differenceInDays(new Date(), this.state.lastSeenTime) > 30) {

                lastSeenText = format(this.state.lastSeenTime, 'd MMM yyyy', { locale: this.locale });

            } else {

                lastSeenText = format(this.state.lastSeenTime, 'd MMM HH:mm', { locale: this.locale });
            }
        }

        const activityIcon = (
            <IconSvg
                source= { require('../resources/svg/activity.json') as SvgFile }
                style={ { marginRight: SPACING, opacity: 0.7 } }
                fillColor={ this.props.fontColor }
                height={ this.props.fontSize }
                width={ this.props.fontSize }
            />
        );

        return (
            <RX.View style={ styles.container }>
                { activityIcon }
                <RX.Text
                    allowFontScaling={ false }
                    style={{ color: this.props.fontColor, fontSize: this.props.fontSize, fontFamily: AppFont.fontFamily }}
                >
                    { lastSeenText }
                </RX.Text>
            </RX.View>
        );
    }
}
