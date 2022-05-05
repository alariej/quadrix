import packageJson from '../package.json';

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
export const APP_NAME = 'Quadrix';
export const APP_WEBSITE = 'quadrix.chat';
export const APP_WEBSITE_URL = 'https://quadrix.chat';
export const GIT_REPO_URL = 'https://github.com/alariej/quadrix#readme';
export const TERMS_URL = 'https://github.com/alariej/quadrix#terms--privacy--license';

// jitsi server

export const JITSI_SERVER_URL = 'https://jitsi.riot.im';

// push notification gateway

export const PUSH_GATEWAY_URL = 'https://quadrix.chat/_matrix/push/v1/notify';

// other

export const MESSAGE_COUNT_INC = 100;
export const MESSAGE_COUNT_ADD = 100;
