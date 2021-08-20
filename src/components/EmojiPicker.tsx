import React, { ReactElement } from 'react';
import RX from 'reactxp';
import { FONT_EMOJI_LARGE, SPACING, TILE_BACKGROUND } from '../ui';
import { VirtualListView, VirtualListViewItemInfo, VirtualListViewCellRenderDetails } from 'reactxp-virtuallistview';

const styles = {
    container: RX.Styles.createViewStyle({
        flex: 1,
    }),
    emojiRow: RX.Styles.createViewStyle({
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: TILE_BACKGROUND,
    }),
};

interface EmojiPickerProps {
    emojiArray: ReactElement[];
}

interface EmojiRowItemInfo extends VirtualListViewItemInfo {
    emojiRow: ReactElement[];
}

export default class EmojiPicker extends RX.Component<EmojiPickerProps, RX.Stateless> {

    private emojiArray: EmojiRowItemInfo[] = [];

    constructor(props: EmojiPickerProps) {
        super(props);

        let i = 0;
        while (i < props.emojiArray.length) {

            const emojiRow_: EmojiRowItemInfo = {
                key: String(i),
                height: FONT_EMOJI_LARGE + 2 * SPACING,
                template: 'emojiRow',
                emojiRow: props.emojiArray.slice(i, i + 5),
                measureHeight: false,
            }

            this.emojiArray.push(emojiRow_);
            i = i + 5;
        }
    }

    private renderItem = (cellRender: VirtualListViewCellRenderDetails<EmojiRowItemInfo>) => {

        const rowWrapper = (
            <RX.View
                style={ styles.emojiRow }
                onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                { cellRender.item.emojiRow }
            </RX.View>
        )

        return rowWrapper;
    }

    public render(): JSX.Element | null {

        return (
            <RX.View
                style={ styles.container }
                onPress={ (event: RX.Types.SyntheticEvent) => event.stopPropagation() }
                disableTouchOpacityAnimation={ true }
                activeOpacity={ 1 }
            >
                <VirtualListView
                    itemList={ this.emojiArray }
                    renderItem={ this.renderItem }
                    keyboardShouldPersistTaps={ true }
                />
            </RX.View>
        );
    }
}
