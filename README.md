# ![quadrix](https://quadrix.chat/logo84.png)

## Quadrix

- Minimal, simple, multi-platform chat client for the [Matrix](https://github.com/matrix-org/) protocol
- No data collection whatsoever
- Does not support end-to-end encryption (E2EE)
- No customization, no widgets, no bots, no phone calls
- Integrated video-conferencing with [Element Call](https://github.com/vector-im/element-call)
- Programmed with [ReactXP](https://github.com/Microsoft/reactxp)
- React Native apps for Android and iOS
- Electron apps for Windows, MacOS, and Linux (amd64, arm64, armhf)
- Web app (unstable, for testing only, but works in desktop and mobile browsers) at [app.quadrix.chat](https://app.quadrix.chat)
- Push notifications on mobile devices with Firebase Cloud Messaging
- Unique top-down messaging feed

## Use cases

- Private homeserver owners looking to get their non-tech friends & family to chat on Matrix
- Matrix users participating in unencrypted public rooms only
- Small organizations looking for a simple, self-hosted, open-source instant messaging solution

## One code base, several platforms

<p>
    <a href="https://apps.apple.com/us/app/quadrix-chat/id1576110553">
        <img alt="Download on the App Store" src="https://linkmaker.itunes.apple.com/images/badges/en-us/badge_appstore-lrg.svg" height=48>
    </a>
    <a href="https://play.google.com/store/apps/details?id=chat.quadrix.android">
        <img alt="Get it on Google Play" src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" height=48>
    </a>
</p>

<p>
    <a href="https://apps.apple.com/us/app/quadrix-chat-desktop/id1577585119">
        <img alt="Download on the Mac App Store" src="https://upload.wikimedia.org/wikipedia/commons/5/5d/Download_on_the_Mac_App_Store_Badge_US-UK_RGB_blk.svg" height=48>
    </a>
    <a href="https://apps.microsoft.com/store/detail/quadrixchat/9NPZ93X49V00">
        <img alt="Get it from Microsoft" src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" height=48>
    </a>
    <a href="https://snapcraft.io/quadrix">
        <img alt="Get it from the Snap Store" src="https://snapcraft.io/static/images/badges/en/snap-store-black.svg" height=48>
    </a>
    <a href="https://flathub.org/apps/details/chat.quadrix.Quadrix">
        <img alt="Download On FLATHUB" src="https://flathub.org/assets/badges/flathub-badge-en.png" height=48>
    </a>
</p>

## Note for Mobile Linux Users

- The arm64 flatpak build was tested on a PinePhone running Mobian/Phosh, which uses the Wayland display server protocol. Unfortunately, Quadrix and most Electron applications running in Wayland mode are not really usable in that environment, since Electron has a basic compatibility problem with the Wayland text input protocol: The on-screen keyboard doesn't automatically launch when editing text input fields, and some letters and many symbols are simply ignored by the keyboard (squeekboard package in Phosh). This issue is being worked on at the Chromium level, but no target date is yet known. (The current flatpak build has the Ozone/Wayland switch disabled for Phosh: The app looks blurry on the PinePhone, but at least the on-screen keyboard works)

## Matrix Protocol Implementation

- [x] Room directory (Linux version only)
- [ ] Room tag showing
- [ ] Room tag editing
- [ ] Search joined rooms
- [x] Room user list
- [x] Display room description (public rooms only)
- [ ] Edit room description
- [ ] Highlights
- [x] Pushrules (new messages in private rooms only)
- [x] Send read markers
- [x] Display read markers (private rooms only)
- [x] Sending invites (private rooms only)
- [x] Accepting invites (private rooms only)
- [ ] Typing notification
- [ ] E2EE
- [x] Replies
- [ ] Threads
- [ ] Message search
- [x] Attachment uploading
- [x] Attachment downloading
- [ ] Send stickers
- [ ] Send formatted messages markdown
- [ ] Rich Text editor for formatted messages
- [ ] Display formatted messages
- [x] Redacting
- [ ] Multiple Matrix accounts
- [x] New user registration (support for ReCaptcha, email address)
- [x] VoIP (Element Call)
- [ ] Reactions
- [x] Message editing (displaying only)
- [ ] Room upgrades
- [x] Localizations (English, German, French, Spanish)
- [ ] SSO Support

## Installation
For all platforms:
- `npm install`

Additionally for iOS:
- `cd ios`
- `pod install`

## Main Commands

- `npm run start:web` - starts Webpack and serves the web app on http://localhost:9999
- `npm run start:rndev` - starts the React Native development server
- `npm run start:android` - starts the Android version of the app and opens it in an emulator or connected device
- `npm run start:ios` - starts the iOS version of the app and opens it in a simulator or connected device

## Issues & Bugs

Please report issues, problems, crashes, bugs, etc. in the [Issues](https://github.com/alariej/quadrix/issues) section of this repository.

## Terms / Privacy / License

Quadrix is provided without warranty of any kind. In no event shall the copyright holder be liable for any claim, damages or other liability arising from the use of this software.

When using Quadrix, you are required to abide by any applicable laws. You can not use Quadrix for unlawful, illegal, defamatory, harmful, abusive, hateful, or ethnically offensive purposes.

The Quadrix apps do not collect any information whatsover: No user ID's, no IP addresses, no messaging statistics, no usage data, no crash analytics, no nothing. However, the homeserver provider chosen by the user, the push notification service for mobile devices ([Firebase Cloud Messaging](https://firebase.google.com/support/privacy)) and the video-conferencing service ([Element Call](https://github.com/vector-im/element-call)) might collect usage data and other information for their own purposes. Please refer to their respective privacy policies for additional information.

Quadrix is released under the [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html), requiring everyone to share their modifications when they also share the software in public. That aspect is commonly referred to as Copyleft.

Copyright (c) 2023 Jean-François Alarie

## Contact

- Matrix: @alariej:matrix.org
- Matrix: #quadrix:matrix.org
- Email: alariej (at) quadrix.chat
- LinkedIn: [www.linkedin.com/in/alariej](https://www.linkedin.com/in/alariej)
