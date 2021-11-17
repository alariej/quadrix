import React from 'react';
import RX from 'reactxp';
import DataStore from '../stores/DataStore';
import { ComponentBase } from 'resub';
import ApiClient from '../matrix/ApiClient';
import { Languages, online, recentActivity, todayWord, yesterdayWord } from '../translations';
import UiStore from '../stores/UiStore';
import { differenceInDays, differenceInMilliseconds, format, isToday, isYesterday } from 'date-fns';

interface UserPresenceState {
    lastSeenTime: number;
}

interface UserPresenceProps extends RX.CommonProps {
    userId: string;
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
    protected _buildState(nextProps: UserPresenceProps): UserPresenceState {

        return { lastSeenTime: DataStore.getLastSeenTime(nextProps.userId) }
    }

    public componentDidMount(): void {
        super.componentDidMount();

        this.isMounted_ = true;

        ApiClient.getPresence(this.props.userId)
            .then(response => {
                if (response?.last_active_ago) {
                    const lastSeenTime = Date.now() - response.last_active_ago;
                    if (lastSeenTime > this.state.lastSeenTime) {
                        if (this.isMounted_) { this.setState({ lastSeenTime: lastSeenTime }) }
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

            lastSeenText = recentActivity[this.language] + 'N/A';

        } else if (differenceInMilliseconds(new Date(), this.state.lastSeenTime) < 30000) {

            lastSeenText = online[this.language];

            setTimeout(this.resetPresence, 31000);

        } else {

            let lastSeenTimeFormatted = '';

            if (isToday(this.state.lastSeenTime)) {

                lastSeenTimeFormatted = todayWord[this.language] + format(this.state.lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (isYesterday(this.state.lastSeenTime)) {

                lastSeenTimeFormatted = yesterdayWord[this.language] + format(this.state.lastSeenTime, ' HH:mm', { locale: this.locale });

            } else if (differenceInDays(new Date(), this.state.lastSeenTime) > 30) {

                lastSeenTimeFormatted = format(this.state.lastSeenTime, 'd MMM. yyyy', { locale: this.locale });

            } else {

                lastSeenTimeFormatted = format(this.state.lastSeenTime, 'd MMM. HH:mm', { locale: this.locale });
            }

            lastSeenText = recentActivity[this.language] + lastSeenTimeFormatted;
        }

        return (
            <RX.Text>
                { lastSeenText}
            </RX.Text>
        );
    }
}
