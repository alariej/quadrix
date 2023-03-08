import RX from 'reactxp';
import Locale from '../modules/Locale';
import { autoSubscribeWithKey, AutoSubscribeStore, StoreBase } from 'resub';
import { ViewOnLayoutEvent } from 'reactxp/dist/common/Types';
import { Languages } from '../translations';
import { Locale as LocaleType } from 'date-fns';
import { enUS, de, fr, es } from 'date-fns/locale';
import { PAGE_WIDTH_DEFAULT, PAGE_WIDE_PADDING } from '../ui';

const UnknownAccessToken = 'UnknownAccessToken';
const OfflineTrigger = 'OfflineTrigger';
const SelectedRoomTrigger = 'SelectedRoomTrigger';
const LayoutTrigger = 'LayoutTrigger';
type DeviceType = 'mobile' | 'desktop';
type DesktopOsType = 'Windows' | 'MacOS' | 'Linux';
type LayoutType = 'wide' | 'narrow';

export type Layout = {
	type: LayoutType;
	containerWidth: number;
	pageWidth: number;
	screenWidth: number;
	screenHeight: number;
};

@AutoSubscribeStore
class UiStore extends StoreBase {
	public OfflineTrigger = OfflineTrigger;
	public LayoutTrigger = LayoutTrigger;

	private offline = false;
	private platform: RX.Types.PlatformType | undefined;
	private device: DeviceType | undefined;
	private unknownAccessToken = false;
	private locale: LocaleType = enUS;
	private language: Languages = 'en';
	private isElectron = false;
	private appLayout: Layout | undefined;
	private selectedRoom = '';

	public setUnknownAccessToken(isUnknown: boolean) {
		this.unknownAccessToken = isUnknown;

		this.trigger(UnknownAccessToken);
	}

	@autoSubscribeWithKey(UnknownAccessToken)
	public getUnknownAccessToken(): boolean {
		return this.unknownAccessToken;
	}

	public setOffline(offline: boolean) {
		this.offline = offline;

		this.trigger(OfflineTrigger);
	}

	@autoSubscribeWithKey(OfflineTrigger)
	public getOffline(): boolean {
		return this.offline;
	}

	public setPlatform() {
		this.platform = RX.Platform.getType();
	}

	public getPlatform(): RX.Types.PlatformType {
		return this.platform!;
	}

	public setDevice() {
		if (this.platform === 'web') {
			this.device = navigator.userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
		} else {
			this.device = 'mobile';
		}
	}

	public getDevice(): DeviceType {
		return this.device!;
	}

	public setIsElectron() {
		if (this.platform === 'web') {
			this.isElectron = navigator.userAgent.toLowerCase().includes('electron');
		}
	}

	public getIsElectron(): boolean {
		return this.isElectron;
	}

	public getDesktopOS(): DesktopOsType {
		const userAgent = navigator.userAgent.toLowerCase();

		if (userAgent.indexOf('win') !== -1) {
			return 'Windows';
		} else if (userAgent.indexOf('mac') !== -1) {
			return 'MacOS';
		} else {
			return 'Linux';
		}
	}

	public async setLocale(): Promise<void> {
		const locale = await Locale.getLocale().catch();
		const language = locale.slice(0, 2);

		switch (language) {
			case 'en':
				this.locale = enUS;
				this.language = 'en';
				break;

			case 'de':
				this.locale = de;
				this.language = 'de';
				break;

			case 'fr':
				this.locale = fr;
				this.language = 'fr';
				break;

			case 'es':
				this.locale = es;
				this.language = 'es';
				break;

			default:
				this.locale = enUS;
				this.language = 'en';
		}
	}

	public getLanguage(): Languages {
		return this.language;
	}

	public getLocale(): LocaleType {
		return this.locale;
	}

	public setAppLayout(layout: ViewOnLayoutEvent) {
		const layoutType: LayoutType =
			layout.width >= PAGE_WIDTH_DEFAULT * 2 + PAGE_WIDE_PADDING * 2 ? 'wide' : 'narrow';

		this.appLayout = {
			type: layoutType,
			containerWidth: layoutType === 'narrow' ? layout.width * 2 : PAGE_WIDTH_DEFAULT * 2 + PAGE_WIDE_PADDING * 2,
			pageWidth: layoutType === 'narrow' ? layout.width : PAGE_WIDTH_DEFAULT,
			screenWidth: layout.width,
			screenHeight: layout.height,
		};

		this.trigger(LayoutTrigger);
	}

	@autoSubscribeWithKey(LayoutTrigger)
	public getAppLayout(): Layout {
		return this.appLayout!;
	}

	public getAppLayout_(): Layout {
		return this.appLayout!;
	}

	public setSelectedRoom(roomId: string) {
		this.selectedRoom = roomId;
		this.trigger(SelectedRoomTrigger);
	}

	@autoSubscribeWithKey(SelectedRoomTrigger)
	public getSelectedRoom(): string {
		return this.selectedRoom;
	}
}

export default new UiStore();
