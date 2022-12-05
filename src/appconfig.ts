import packageJson from '../package.json';
import StoreJson from '../stores.json';

export const APP_VERSION = packageJson.version;

// matrix prefixes

export const PREFIX_REST = '/_matrix/client/v3/';
export const PREFIX_MEDIA = '/_matrix/media/v3/';
export const PREFIX_DOWNLOAD = '/_matrix/media/v3/download/';
export const PREFIX_UPLOAD = '/_matrix/media/v3/upload';

// app info

export const APP_ID = 'chat.quadrix';
export const APP_ID_ANDROID = 'chat.quadrix.android';
export const APP_ID_IOS = 'chat.quadrix.ios';
export const APP_ID_LINUX = 'chat.quadrix.linux';
export const APP_ID_WINDOWS = 'chat.quadrix.windows';
export const APP_ID_MACOS = 'chat.quadrix.macos';
export const APP_ID_WEB = 'chat.quadrix.web';
export const APP_NAME = 'Quadrix';
export const APP_WEBSITE = 'quadrix.chat';
export const APP_WEBSITE_URL = 'https://quadrix.chat';
export const GIT_REPO_URL = 'https://github.com/alariej/quadrix#readme';
export const TERMS_URL = 'https://github.com/alariej/quadrix#terms--privacy--license';
export const GITHUB_SPONSOR_URL = 'https://github.com/sponsors/alariej';
export const APPSTORES_INFO_URL = 'https://raw.githubusercontent.com/alariej/quadrix/dev/stores.json';
export const APPSTORES_IOS_URL = StoreJson.appstore.url;
export const APPSTORES_MACOS_URL = StoreJson.macappstore.url;
export const APPSTORES_ANDROID_URL = StoreJson.googleplay.url;
export const APPSTORES_WINDOWS_URL = StoreJson.microsoft.url;
export const APPSTORES_FLATHUB_URL = StoreJson.flathub.url;

// jitsi server

export const JITSI_SERVER_URL = 'https://jitsi.riot.im';

// push notification gateway

export const PUSH_GATEWAY_URL = 'https://quadrix.chat/_matrix/push/v1/notify';

// other

export const MESSAGE_COUNT_INC = 100;
export const MESSAGE_COUNT_ADD = 100;
export const INACTIVE_DAYS = 30;
export const CLEAR_DATASTORE = false;
