import UiStore from '../../stores/UiStore';

class Locale {

    public async getLocale(): Promise<string> {

        let locale: string;

        if (UiStore.getIsElectron()) {

            const { ipcRenderer } = window.require('electron');

            locale = await ipcRenderer.invoke('getLocale').catch(_error => null) as string;

        } else {

            locale = navigator.language;
        }

        return locale;
    }
}

export default new Locale();
