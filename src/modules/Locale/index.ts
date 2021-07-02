import UiStore from "../../stores/UiStore";

class Locale {

    public getLocale(): string {

        let locale: string;

        if (UiStore.getIsElectron()) {

            const { remote } = window.require('electron');
            locale = remote.app.getLocale();

        } else {

            locale = navigator.language;
        }

        return locale;
    }
}

export default new Locale();
