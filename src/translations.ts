/* eslint-disable max-len */
import { APP_NAME, JITSI_SERVER_URL } from "./appconfig"

export type Languages = 'en' | 'de' | 'fr';

type Translation = { [key: string]: string }

export const createNewConv: Translation = {
    en: 'Start new conversation',
    de: 'Neuen Chat starten',
    fr: 'Lancer une nouvelle conversation',
}

export const createNewGroup: Translation = {
    en: 'Create new group',
    de: 'Neue Gruppe erstellen',
    fr: 'Créer un nouveau groupe',
}

export const joinPublicComm: Translation = {
    en: 'Join public group',
    de: 'Öffentliche Gruppe beitreten',
    fr: 'Joindre un groupe public',
}

export const createNewNote: Translation = {
    en: 'Create new notepad',
    de: 'Neuen Notizblock erstellen',
    fr: 'Créer un nouveau bloc-notes',
}

export const notepad: Translation = {
    en: 'Notepad',
    de: 'Notizblock',
    fr: 'Bloc-notes',
}

export const inviteUser: Translation = {
    en: 'Invite User',
    de: 'Einladen',
    fr: 'Inviter',
}

export const searchUser: Translation = {
    en: 'Search User',
    de: 'Suchen...',
    fr: 'Chercher...',
}

export const searchInstruction: Translation = {
    en: 'Search for a user or directly enter a Matrix user ID (@user:server)',
    de: 'Suchen Sie nach einem Benutzer oder geben Sie direkt eine Matrix ID (@benutzer:server) ein',
    fr: 'Recherchez un usager ou saisissez directement une ID Matrix (@usager:serveur)',
}

export const tooManySearchResults: Translation = {
    en: 'Too many results, please refine your search terms',
    de: 'Zu viele Ergebnisse, bitte verfeinern Sie Ihre Suchbegriffe',
    fr: 'Trop de résultats, veuillez affiner votre recherche',
}

export const noSearchResults: Translation = {
    en: 'No result, please change your search terms',
    de: 'Kein Ergebnis, bitte ändern Sie Ihre Suchbegriffe',
    fr: 'Aucun résultat, veuillez modifier votre recherche',
}

export const enterSearch: Translation = {
    en: 'Search terms / Matrix user ID',
    de: 'Suchbegriffe / Matrix Benutzer-ID',
    fr: 'Termes de recherche / ID d\'usager',
}

export const userServer: Translation = {
    en: '@user:server',
    de: '@benutzer:server',
    fr: '@usager:serveur',
}

export const errorNoConfirm: Translation = {
    en: 'Error: The server has not confirmed the operation.',
    de: 'Fehler: Der Server hat die Operation nicht bestätigt.',
    fr: 'Erreur: Le serveur n\'a pas confirmé l\'opération.',
}

export const theUserId: Translation = {
    en: 'The user ID',
    de: 'Die Benutzer-ID',
    fr: 'L\'ID d\'usager',
}

export const doesntSeemToExist: Translation = {
    en: "doesn't seem to exist.",
    de: 'scheint nicht zu existieren.',
    fr: 'ne semble pas exister.',
}

export const cancel: Translation = {
    en: 'Cancel',
    de: 'Abbrechen',
    fr: 'Annuler',
}

export const close: Translation = {
    en: 'Close',
    de: 'Schliessen',
    fr: 'Fermer',
}

export const createGroup: Translation = {
    en: 'Create Group',
    de: 'Erstellen',
    fr: 'Créer',
}

export const groupName: Translation = {
    en: 'Group name',
    de: 'Gruppenname',
    fr: 'Nom du groupe',
}

export const createNotepad: Translation = {
    en: 'Create Notepad',
    de: 'Erstellen',
    fr: 'Créer',
}

export const notepadName: Translation = {
    en: 'Notepad name',
    de: 'Notizblock-Name',
    fr: 'Nom du bloc-notes',
}

export const theSearchDidNotReturn: Translation = {
    en: 'The search did not return any result. Please try another search term.',
    de: 'Die Suche lieferte kein Ergebnis. Bitte versuchen Sie einen anderen Suchbegriff.',
    fr: 'La recherche n\'a donné aucun résultat. Veuillez essayer un autre terme de recherche.',
}

export const theSearchTakesTooLong: Translation = {
    en: 'The search takes too long. You can cancel to stop the search, or keep waiting.',
    de: 'Die Suche dauert zu lange. Sie können die Suche abbrechen, oder weiter warten.',
    fr: 'La recherche prend trop de temps. Vous pouvez annuler la recherche, ou continuer à attendre.',
}

export const waitSearch: Translation = {
    en: 'Wait',
    de: 'Warten',
    fr: 'Attendre',
}

export const theSearchReturnedError: Translation = {
    en: 'The search returned an error',
    de: 'Die Suche ergab einen Fehler',
    fr: 'La recherche a généré une erreur',
}

export const pressOKToJoin: Translation = {
    en: 'Press OK to join the',
    de: 'Drücken Sie OK, um der öffentlichen Gruppe',
    fr: 'Appuyez sur OK pour joindre le groupe public',
}

export const theCommunity: Translation = {
    en: ' public group',
    de: ' beizutreten',
    fr: '',
}

export const search: Translation = {
    en: 'Search',
    de: 'Suchen',
    fr: 'Chercher',
}

export const communityName: Translation = {
    en: 'Public group name or alias (optional)',
    de: 'Name / Alias der Gruppe (optional)',
    fr: 'Nom / alias du groupe (facultatif)',
}

export const serverName: Translation = {
    en: 'Server name (optional)',
    de: 'Server-Name (optional)',
    fr: 'Nom du serveur (facultatif)',
}

export const newPasswordNoMatch: Translation = {
    en: 'New password entries do not match',
    de: 'Neue Passworteingaben stimmen nicht überein',
    fr: 'Les nouveaux mots de passe ne correspondent pas',
}

export const passwordChanged: Translation = {
    en: 'Password successfully changed.',
    de: 'Passwort erfolgreich geändert.',
    fr: 'Le mot de passe a été modifié avec succès.',
}

export const userSettings: Translation = {
    en: 'Settings',
    de: 'Einstellungen',
    fr: 'Réglages',
}

export const displayName: Translation = {
    en: 'Display Name',
    de: 'Display-Name',
    fr: "Nom d'affichage",
}

export const enterYourName: Translation = {
    en: 'Enter your name',
    de: 'Ihren Namen eingeben',
    fr: 'Entrez votre nom',
}

export const profilePicture: Translation = {
    en: 'Profile Picture',
    de: 'Profil-Bild',
    fr: 'Photo de profil',
}

export const photos: Translation = {
    en: 'Photos',
    de: 'Fotos',
    fr: 'Photos',
}

export const files: Translation = {
    en: 'Files',
    de: 'Dateien',
    fr: 'Fichiers',
}

export const userPassword: Translation = {
    en: 'Password',
    de: 'Passwort',
    fr: 'Mot de passe',
}

export const currentPassword: Translation = {
    en: 'Current password',
    de: 'Aktuelles Passwort',
    fr: 'MdP Actuel',
}

export const newPassword: Translation = {
    en: 'New password',
    de: 'Neues Passwort',
    fr: 'Nouveau MdP',
}

export const repeatNewPassword: Translation = {
    en: 'Repeat new password',
    de: 'Neu. Passw. wiederhol.',
    fr: 'Répéter nouveau MdP',
}

export const save: Translation = {
    en: 'Save',
    de: 'Speichern',
    fr: 'Sauvegarder',
}

export const pressOKToLogout: Translation = {
    en: 'Press OK to log out and clear ' + APP_NAME + '\'s local storage. You will need your user ID and password to log back in.',
    de: 'Drücken Sie OK, um sich auszuloggen und den lokalen Speicher von ' + APP_NAME + ' zu löschen. Sie werden Ihre Benutzer-ID und Ihr Passwort benötigen, um sich wieder einloggen zu können.',
    fr: 'Appuyer sur OK pour vous déconnecter et vider le stockage local de ' + APP_NAME + '. Vous aurez besoin de votre ID d\'usager et de votre mot de passe pour vous reconnecter.',
}

export const termsPrivacyLicense: Translation = {
    en: 'Terms / Privacy / License',
    de: 'Bedingungen / Datenschutz / Lizenz',
    fr: 'Conditions / Confidentialité / Licence',
}

export const forward: Translation = {
    en: 'Forward',
    de: 'Weiterleiten',
    fr: 'Faire suivre',
}

export const reply: Translation = {
    en: 'Reply',
    de: 'Antworten',
    fr: 'Répondre',
}

export const report: Translation = {
    en: 'Report',
    de: 'Melden',
    fr: 'Signaler',
}

export const doYouReallyWantToReport: Translation = {
    en: 'Do you really want to report this message as objectionable or offensive to the server\'s administrator?',
    de: 'Möchten Sie diese Nachricht wirklich als anstößig oder beleidigend an den Administrator des Servers melden?',
    fr: 'Voulez-vous vraiment signaler ce message comme étant répréhensible ou offensant à l\'administrateur du serveur?',
}

export const messageHasBeenReported: Translation = {
    en: 'The message has been successfully reported to the server\'s administrator',
    de: 'Die Nachricht wurde erfolgreich an den Administrator des Servers gemeldet',
    fr: 'Le message a été signalé avec succès à l\'administrateur du serveur',
}

export const forwardTo: Translation = {
    en: 'Forward to',
    de: 'Weiterleiten an',
    fr: 'Faire suivre à'
}

export const pressOKToForward1: Translation = {
    en: 'Press OK to forward the message to',
    de: 'Drücken Sie OK, um die Nachricht an',
    fr: 'Appuyez sur OK pour faire suivre le message à'
}

export const pressOKToForward2: Translation = {
    en: '',
    de: 'zu weiterleiten',
    fr: ''
}

export const sendTo: Translation = {
    en: 'Send to',
    de: 'Senden an',
    fr: 'Envoyer à',
}

export const open: Translation = {
    en: 'Open',
    de: 'Öffnen',
    fr: 'Ouvrir',
}

export const share: Translation = {
    en: 'Share',
    de: 'Teilen ',
    fr: 'Partager',
}

export const messageCouldNotBeSent: Translation = {
    en: 'Error: The message could not be sent.',
    de: 'Fehler: Die Nachricht konnte nicht gesendet werden.',
    fr: 'Erreur : Le message n\'a pas pu être envoyé.',
}

export const hasCreatedTheRoom: Translation = {
    en_di: ' has started the conversation',
    en_gr: ' has created the group',
    en_co: ' has created the public group',
    en_no: ' has created the notepad',
    de_di: ' hat den Chat gestartet',
    de_gr: ' hat die Gruppe erstellt',
    de_co: ' hat die öffentliche Gruppe erstellt',
    de_no: ' hat den Notizblock erstellt',
    fr_di: ' a lancé la conversation',
    fr_gr: ' a créé le groupe',
    fr_co: ' a créé le groupe public',
    fr_no: ' a crée le bloc-notes',
}

export const hasJoinedTheRoom: Translation = {
    en_di: ' has joined the conversation',
    en_gr: ' has joined the group',
    en_co: ' has joined the public group',
    de_di: ' hat sich dem Chat angeschlossen',
    de_gr: ' ist der Gruppe beigetreten',
    de_co: ' ist der öffentlichen Gruppe beigetreten',
    fr_di: ' a joint la conversation',
    fr_gr: ' a joint le groupe',
    fr_co: ' a joint le groupe public',
}

export const hasLeftTheRoom: Translation = {
    en_di: ' has left the conversation',
    en_gr: ' has left the group',
    en_co: ' has left the public group',
    de_di: ' hat den Chat verlassen',
    de_gr: ' hat die Gruppe verlassen',
    de_co: ' hat die öffentliche Gruppe verlassen',
    fr_di: ' a quitté la conversation',
    fr_gr: ' a quitté le groupe',
    fr_co: ' a quitté le groupe public',
}

export const hasDeclinedTheInvitation: Translation = {
    en: ' has declined the invitation',
    de: ' hat die Einladung abgelehnt',
    fr: ' a decliné l\'invitation',
}

export const hasInvitedToRoom = (member: string, key: string): string => {

    switch (key) {
        case 'en_di':
            return ` has invited ${ member } to the conversation`;

        case 'en_gr':
            return ` has invited ${ member } to the group`;

        case 'en_co':
            return ` has invited ${ member } to the public group`;

        case 'de_di':
            return ` hat ${ member } zu dem Chat eingeladen`;

        case 'de_gr':
            return ` hat ${ member } in die Gruppe eingeladen`;

        case 'de_co':
            return ` hat ${ member } in die öffentliche Gruppe eingeladen`;

        case 'fr_di':
            return ` a invité ${ member } à la conversation`;

        case 'fr_gr':
            return ` a invité ${ member } au groupe`;

        case 'fr_co':
            return ` a invité ${ member } au groupe public`;

        default:
            return '';
    }
}

// TODO: notepad
export const hasRenamedTheRoom: Translation = {
    en_di: ' has renamed the conversation',
    en_gr: ' has renamed the group',
    en_co: ' has renamed the public group',
    de_di: ' hat den Chat umbenannt',
    de_gr: ' hat die Gruppe umbenannt',
    de_co: ' hat die öffentliche Gruppe umbenannt',
    fr_di: ' a renommé la conversation',
    fr_gr: ' a renommé le groupe',
    fr_co: ' a renommé le groupe public',
}

export const hasChangedAvatar: Translation = {
    en_di: ' has changed her/his profile picture',
    en_gr: ' has changed the group\'s profile picture',
    en_co: ' has changed the public group\'s profile picture',
    en_no: ' has changed the notepad\'s profile picture',
    de_di: ' hat ihr/sein Profilbild geändert',
    de_gr: ' hat das Profilbild der Gruppe geändert',
    de_co: ' hat das Profilbild der öffentlichen Gruppe geändert',
    de_no: ' hat das Profilbild des Notizblocks geändert',
    fr_di: ' a changé sa photo de profil',
    fr_gr: ' a changé la photo de profil du groupe',
    fr_co: ' a changé la photo de profil du groupe public',
    fr_no: ' a changé la photo de profil du bloc-notes',
}

export const pickNewAvatar: Translation = {
    en: 'Pick new avatar',
    de: 'Neues Bild wählen',
    fr: 'Chosir nouvelle photo,'
}

export const todayWord: Translation = {
    en: 'Today',
    de: 'Heute',
    fr: 'Aujourd\'hui',
}

export const yesterdayWord: Translation = {
    en: 'Yesterday',
    de: 'Gestern',
    fr: 'hier',
}

export const fetchingMessages: Translation = {
    en: 'Fetching messages',
    de: 'Nachrichten-Abruf',
    fr: 'Récupération',
}

export const noMoreMessages: Translation = {
    en: 'No more messages to fetch',
    de: 'Es sind keine Nachrichten mehr zu holen',
    fr: 'Il n\'y a plus de messages à récupérer',
}

export const errorLoadingMessages: Translation = {
    en: 'There was an error while loading the messages',
    de: 'Es gab einen Fehler beim Laden von Nachrichten',
    fr: 'Il y a eu une erreur dans la récupération des messages',
}

export const alias: Translation = {
    en: 'Alias',
    de: 'Alias',
    fr: 'Alias',
}

export const topic: Translation = {
    en: 'Topic',
    de: 'Thema',
    fr: 'Sujet',
}

export const members: Translation = {
    en: 'Members',
    de: 'Mitglieder',
    fr: 'Membres'
}

export const wrote: Translation = {
    en: 'wrote',
    de: 'hat geschrieben',
    fr: 'a écrit',
}

export const shareWith: Translation = {
    en: 'Share with...',
    de: 'Teilen mit...',
    fr: 'Partager avec...',
}

export const sending: Translation = {
    en: 'Sending ',
    de: 'Versenden des Dokuments ',
    fr: 'Envoi du document ',
}

export const messageDeleted: Translation = {
    en: '*** Message deleted ***',
    de: '*** Nachricht gelöscht ***',
    fr: '*** Message effacé ***',
}

export const clickHereOrPressShftEnter: Translation = {
    en: 'Click here or press Shift-Enter to send message',
    de: 'Hier klicken oder Umschalt-Eingabetaste drücken, um die Nachricht zu senden',
    fr: 'Cliquez ici ou appuyez sur Shift-Enter pour envoyer le message',
}

export const pressSend: Translation = {
    en: 'Send',
    de: 'Senden',
    fr: 'Envoyer',
}

export const pressLoad: Translation = {
    en: 'Load',
    de: 'Laden',
    fr: 'Charger',
}

export const theInvitationWasSent: Translation = {
    en: 'The invitation to join the group was sent.',
    de: 'Die Einladung, der Gruppe beizutreten, wurde verschickt.',
    fr: 'L\'invitation à joindre le groupe a été envoyée.',
}

export const theInvitationNotSent: Translation = {
    en: 'Error: The invitation could not be sent.',
    de: 'Fehler: Die Einladung konnte nicht verschickt werden.',
    fr: 'Erreur: L\'invitation n\'a pu être envoyée.',
}

export const pressOKToInvite: Translation = {
    en: 'Press OK to invite',
    de: 'Drücken Sie OK, um',
    fr: 'Appuyez sur OK pour inviter',
}

export const toThisGroup: Translation = {
    en: 'to this group',
    de: 'in diese Gruppe einzuladen',
    fr: 'à ce groupe',
}

export const pressOKToLeaveRoom: Translation = {
    en_di: 'Press OK to leave this conversation. You will lose access to all included messages and files.',
    en_gr: 'Press OK to leave this group. You will lose access to all included messages and files.',
    en_co: 'Press OK to leave this public group.',
    en_no: 'Press OK to delete this notepad. You will lose access to all included content.',
    de_di: 'Drücken Sie OK, um diesen Chat zu verlassen. Sie werden den Zugang zu allen enthaltenen Nachrichten und Dateien verlieren.',
    de_gr: 'Drücken Sie OK, um diese Gruppe zu verlassen. Sie werden den Zugang zu allen enthaltenen Nachrichten und Dateien verlieren.',
    de_co: 'Drücken Sie OK, um diese öffentliche Gruppe zu verlassen.',
    de_no: 'Drücken Sie OK, um diesen Notizblock zu löschen. Sie werden den Zugang zu allen enthaltenen Inhalten.',
    fr_di: 'Appuyez sur OK pour quitter cette conversation. Vous perdrez accès à tous les messages et fichiers qui s\'y trouvent.',
    fr_gr: 'Appuyez sur OK pour quitter ce groupe. Vous perdrez accès à tous les messages et fichiers qui s\'y trouvent.',
    fr_co: 'Appuyez sur OK pour quitter ce groupe public.',
    fr_no: 'Appuyez sur OK pour supprimer ce bloc-notes. Vous perdrez accès à tout le contenu qui s\'y trouve.',
}

export const inviteAdditionalUser: Translation = {
    en: 'Invite additional user',
    de: 'Benutzer einladen',
    fr: 'Inviter un usager',
}

export const leaveRoom: Translation = {
    en_di: 'Leave conversation',
    en_gr: 'Leave group',
    en_co: 'Leave public group',
    en_no: 'Delete notepad',
    de_di: 'Chat verlassen',
    de_gr: 'Gruppe verlassen',
    de_co: 'Gruppe verlassen',
    de_no: 'Notizblock löschen',
    fr_di: 'Quitter la conversation',
    fr_gr: 'Quitter le groupe',
    fr_co: 'Quitter le groupe',
    fr_no: 'Supprimer le bloc-notes',
}

export const youDoNotHavePrivateContacts: Translation = {
    en: 'You do not have additional contacts to invite to the group. Create new contacts by inviting users to a conversation.',
    de: 'Sie haben keine zusätzlichen Kontakte, die Sie in die Gruppe einladen können. Erstellen Sie neue Kontakte, indem Sie Benutzer zu einem Chat einladen.',
    fr: 'Vous n\'avez pas de contacts supplémentaires à inviter dans le groupe. Créez de nouveaux contacts en invitant des usagers à une conversation.',
}

export const storageAccess: Translation = {
    en: 'Storage Access',
    de: 'Speicherzugriff.',
    fr: 'Accès au stockage',
}

export const storageAccessMessage: Translation = {
    en: APP_NAME + ' requires storage access for reading and writing files on your mobile device. Continue to the next dialog where you can choose to allow or deny storage access.',
    de: APP_NAME + ' erfordert Speicherzugriff für das Lesen und Schreiben von Dateien auf Ihr mobiles Gerät. Setzen Sie fort zum nächsten Dialog, wo Sie den Speicherzugriff zulassen oder ablehnen können.',
    fr: APP_NAME + ' nécessite l\'accès au stockage pour lire et écrire des fichiers sur votre appareil mobile. Continuez au dialogue suivant où vous pouvez choisir d\'autoriser ou de refuser l\'accès au stockage.',
}

export const continueStorage: Translation = {
    en: 'Continue',
    de: 'Fortsetzen',
    fr: 'Continuer',
}

export const noApplicationWasFound: Translation = {
    en: 'No application was found for viewing this file automatically. You can try to save the file and open it manually with a suitable application.',
    de: 'Es wurde keine Applikation gefunden, um diese Datei automatisch anzusehen. Sie können versuchen, die Datei zu speichern und sie manuell mit einer geeigneten Applikation zu öffnen.',
    fr: 'Aucune application n\'a été trouvée pour visualiser ce fichier automatiquement. Vous pouvez essayer de sauvegarder le fichier et de l\'ouvrir manuellement avec une application appropriée.',
}

export const noFileExplorerWasFound: Translation = {
    en: 'The file explorer could not be launched automatically. Please try to launch it manually from the main application menu on this device.',
    de: 'Der Datei-Explorer konnte nicht automatisch gestartet werden. Bitte versuchen Sie, ihn manuell über das Hauptanwendungsmenü auf diesem Gerät zu starten.',
    fr: 'L\'explorateur de fichiers n\'a pas pu être lancé automatiquement. Veuillez essayer de le lancer manuellement à partir du menu principal des applications de l\' appareil.',
}

export const fileCouldNotAccess: Translation = {
    en: 'The file could not be accessed. There could be a problem with the network or with the permissions on your device.',
    de: 'Die Datei konnte nicht zugegriffen werden. Es könnte ein Problem mit dem Netzwerk oder mit den Berechtigungen auf Ihrem Gerät vorliegen.',
    fr: 'Le fichier n\'a pas pu être consulté. Il pourrait y avoir un problème avec le réseau ou avec les autorisations sur votre appareil.',
}

export const fileCouldNotUpload: Translation = {
    en: 'The file could not be uploaded to the server. There could be a problem with the network or with the permissions on your device.',
    de: 'Die Datei konnte nicht auf dem Server hochgeladen werden. Es könnte ein Problem mit dem Netzwerk oder mit den Berechtigungen auf Ihrem Gerät vorliegen.',
    fr: 'Le fichier n\'a pas pu être téléchargé sur le serveur. Il pourrait y avoir un problème avec le réseau ou avec les autorisations sur votre appareil.',
}

export const fileHasBeenSaved: Translation = {
    en: 'The file has been saved to your device.',
    de: 'Die Datei wurde auf Ihrem Gerät gespeichert.',
    fr: 'Le fichier a été sauvegardé sur votre appareil.',
}

export const fileHasBeenSavedAndroid: Translation = {
    en: '...has been saved to your device\'s Download folder.',
    de: '...wurde im Ordner Download Ihres Geräts gespeichert.',
    fr: '...a été sauvegardé dans le dossier Download de votre appareil.',
}

export const toFolder: Translation = {
    en: 'To Folder',
    de: 'Zum Ordner',
    fr: 'Vers dossier',
}

export const fileCouldNotBeSaved: Translation = {
    en: 'The file could not be saved to your device.',
    de: 'Die Datei konnte nicht auf Ihrem Gerät gespeichert werden.',
    fr: 'Le fichier n\'a pas pu être sauvegardé sur votre appareil.',
}

export const cannotShareFromDownload: Translation = {
    en: 'An error occurred. Sharing files using the Downloads app is currently not supported. Please try sharing the file using the File Manager app.',
    de: 'Ein Fehler ist aufgetreten. Das Teilen von Dateien mit der Downloads-App wird derzeit nicht unterstützt. Bitte versuchen Sie, die Datei mit der Datei-Manager-App zu teilen.',
    fr: 'Une erreur s\'est produite. Le partage de fichiers à l\'aide de l\'application Téléchargements n\'est actuellement pas supporté. Veuillez essayer de partager le fichier en utilisant l\'application Gestionnaire de fichiers.',
}
/*
export const downloading: Translation = {
    en: 'Downloading...',
    de: 'Downloaden...',
    fr: 'Téléchargement...',
}

export const cannotLoadImage: Translation = {
    en: 'Cannot load image',
    de: 'Kann Bild nicht laden',
    fr: 'Impossible de charger l\'image',
}
*/

export const image: Translation = {
    en: 'Image',
    de: 'Bild',
    fr: 'Image',
}

export const deviceOffline: Translation = {
    en: 'Your device seems to be offline, and no data can be found in the local storage. Please go online to view your messages.',
    de: 'Ihr Gerät scheint offline zu sein, und es können keine Daten im lokalen Speicher gefunden werden. Bitte gehen Sie online, um Ihre Nachrichten zu sehen.',
    fr: 'Votre appareil semble être hors ligne, et aucune donnée ne peut être trouvée dans le stockage local. Veuillez vous connecter pour consulter vos messages.',
}

export const invited: Translation = {
    en: 'Invited',
    de: 'E\'laden',
    fr: 'Invité',
}

export const left: Translation = {
    en: 'Left',
    de: 'Weg',
    fr: 'Quitté',
}

export const admin: Translation = {
    en: 'Admin',
    de: 'Admin',
    fr: 'Admin',
}

export const online: Translation = {
    en: 'Online',
    de: 'Online',
    fr: 'En ligne',
}

export const communityMembers = (membersCount: number, language: string): string => {

    switch (language) {
        case 'en':
            return `Public group [${ membersCount } members]`;

        case 'de':
            return `Öffentliche Gruppe [${ membersCount } Mitglieder]`;

        case 'fr':
            return `Groupe public [${ membersCount } membres]`;

        default:
            return '';
    }
}

export const invitationWaiting: Translation = {
    en: '[invitation waiting]',
    de: '[Einladung wartet]',
    fr: '[invitation en attente]',
}

export const archived: Translation = {
    en: '[archived]',
    de: '[archiviert]',
    fr: '[archivé]',
}

export const invitationNotYetAccepted: Translation = {
    en: '[invitation not yet accepted]',
    de: '[Einladung noch nicht akzeptiert]',
    fr: '[invitation pas encore acceptée]',
}

export const acceptInvitation: Translation = {
    en: 'Accept Invitation',
    de: 'Einladung akzeptieren',
    fr: 'Accepter l\'invitation',
}

export const rejectInvitation: Translation = {
    en: 'Reject Invitation',
    de: 'Einladung ablehnen',
    fr: 'Rejeter l\'invitation',
}

export const hasInvitedYou: Translation = {
    en_di: 'has invited you to join a private conversation.',
    en_gr: 'has invited you to join a group conversation.',
    en_co: 'has invited you to join a public group.',
    de_di: 'hat Sie zu einem privaten Chat eingeladen.',
    de_gr: 'hat Sie zu einem Gruppenchat eingeladen.',
    de_co: 'hat Sie eingeladen, einer öffentlichen Gruppe beizutreten.',
    fr_di: 'vous a invité à joindre une conversation privée.',
    fr_gr: 'vous a invité à joindre une conversation de groupe.',
    fr_co: 'vous a invité à joindre un groupe public.'
}

export const haveAnAccount: Translation = {
    en: 'Already have an account?\nLogin here',
    de: 'Bereits ein Konto?\nHier einloggen',
    fr: 'Déjà un compte ?\nConnectez-vous ici',
}

export const noAccount: Translation = {
    en: 'No account? Register here',
    de: 'Kein Konto? Hier anmelden',
    fr: 'Pas de compte? Inscrivez-vous ici',
}

export const login: Translation = {
    en: 'Login',
    de: 'Einloggen',
    fr: 'Connecter',
}

export const register: Translation = {
    en: 'Register',
    de: 'Anmelden',
    fr: 'Inscrire',
}

export const repeatPassword: Translation = {
    en: 'Repeat password',
    de: 'Passwort wiederholen',
    fr: 'Répéter mot de passe',
}

export const server: Translation = {
    en: 'Server',
    de: 'Server',
    fr: 'Serveur',
}

export const userId: Translation = {
    en: 'User ID',
    de: 'Benutzer-ID',
    fr: 'ID d\'usager',
}

export const passwordNoMatch: Translation = {
    en: 'Password entries do not match',
    de: 'Passworteingaben stimmen nicht überein',
    fr: 'Les mots de passe ne correspondent pas',
}

export const userIdPasswordMissing: Translation = {
    en: 'User ID or password missing.',
    de: 'Benutzer-ID oder Passwort fehlt.',
    fr: 'ID d\'usager ou mot de passe manquant.',
}

export const deviceOfflineLogin: Translation = {
    en: 'Your device seems to be offline. Try again once your device has an internet connection.',
    de: 'Ihr Gerät scheint offline zu sein. Versuchen Sie es erneut, sobald Ihr Gerät eine Internetverbindung hat.',
    fr: 'Votre appareil semble être hors ligne. Essayez à nouveau dès que votre appareil dispose d\'une connexion internet.',
}

export const userIdInUse: Translation = {
    en: 'The User ID you entered is already in-use on this server. Please try a new one.',
    de: 'Die eingegebene Benutzer-ID ist auf diesem Server bereits vergeben. Bitte versuchen Sie eine neue.',
    fr: 'L\'ID d\'usager que vous avez saisie est déjà prise sur ce serveur. Veuillez en essayer une nouvelle.'
}

export const confirmationEmail: Translation = {
    en: 'A confirmation e-mail was sent to ',
    de: 'Ein Bestätigungs-E-mail wurde an ',
    fr: 'Un e-mail de confirmation a été envoyé à ',
}

export const firstClickLink: Translation = {
    en: '. First click the link in the message to confirm your e-mail address, then press the OK button below',
    de: ' geschickt. Klicken Sie zuerst auf den Link in der Mitteilung, um Ihre E-mail-Adresse zu bestätigen, und drücken Sie dann unten auf die OK Taste.',
    fr: '. Cliquez d\'abord sur le lien contenu dans le message pour confirmer votre adresse e-mail, puis appuyez sur le bouton OK ci-dessous.',
}

export const serverRequiresEmail: Translation = {
    en: 'This server requires users to submit a valid e-mail address. Please enter your address in the input field below, then press OK to continue with the registration.',
    de: 'Dieser Server erfordert von den Benutzern die Angabe einer gültigen E-mail-Adresse. Bitte geben Sie Ihre Adresse in das Eingabefeld unten ein und drücken Sie dann OK, um mit der Registrierung fortzufahren.',
    fr: 'Ce serveur exige des usagers qu\'ils soumettent une adresse e-mail valide. Veuillez entrer votre adresse dans le champ de saisie ci-dessous, puis appuyez sur OK pour poursuivre l\'inscription.',
}

export const yourEmailAddress: Translation = {
    en: 'Your e-mail address',
    de: 'Ihre E-mail-Adresse',
    fr: 'Votre adresse e-mail',
}

export const emailAddress: Translation = {
    en: 'E-mail Address',
    de: 'E-mail-Adresse',
    fr: 'Adresse e-mail',
}

export const emailNotifications: Translation = {
    en: 'E-mail Notifications',
    de: 'E-mail-Benachrichtig.',
    fr: 'Notifications e-mail',
}

export const clientSideConfNotSupported: Translation = {
    en: 'Client-side e-mail confirmation not yet supported. Registration terminated.',
    de: 'Client-seitige E-mail-Bestätigung wird noch nicht unterstützt. Registrierung beendet.',
    fr: 'La confirmation côté client d\'adresses e-mail n\'est pas encore supportée. Incscription terminée.'
}

export const emailAlreadyUsed: Translation = {
    en: 'The e-mail address is already in use. Registration terminated.',
    de: 'Die E-mail-Adresse wird bereits verwendet. Registrierung beendet.',
    fr: 'L\'adresse e-mail est déjà utilisée. Incription terminée.',
}

/*
export const errorRecaptcha: Translation = {
    en: 'An error has occured during the ReCaptcha procedure.',
    de: 'Ein Fehler ist während des ReCaptcha-Vorgangs aufgetreten.',
    fr: 'Une erreur s\'est produite au cours du processus ReCaptcha.',
}

export const expiredRecaptcha: Translation = {
    en: 'The ReCaptcha has expired',
    de: 'Das ReCaptcha ist abgelaufen.',
    fr: 'Le ReCaptcha a expiré.',
}

export const errorTerms: Translation = {
    en: 'An error has occured during the Terms procedure.',
    de: 'Ein Fehler ist während des Bedingungen-Vorgangs aufgetreten.',
    fr: 'Une erreur s\'est produite au cours du processus des conditions d\'utilisation.',
}

export const errorLogin: Translation = {
    en: 'An error has occured during the Login procedure.',
    de: 'Ein Fehler ist während des Einloggen-Vorgangs aufgetreten.',
    fr: 'Une erreur s\'est produite au cours du processus de connection.',
}
*/

export const errorRegistration: Translation = {
    en: 'An error has occured during the registration procedure.',
    de: 'Ein Fehler ist während des Registrierungs-Vorgangs aufgetreten.',
    fr: 'Une erreur s\'est produite au cours du processus d\'inscription.',
}

export const registrationNotSupported: Translation = {
    en: 'The registration procedure on this server is not yet supported.',
    de: 'Der Registrierungs-Vorgang auf diesem Server wird noch nicht unterstützt.',
    fr: 'La procédure d\'inscription sur ce serveur n\'est pas encore supportée.',
}

export const errorInvalidPassword: Translation = {
    en: 'The user ID or password is invalid.',
    de: 'Die Benutzer-ID oder das Passwort ist ungültig.',
    fr: 'L\'ID d\'usager ou le mot de passe n\'est pas valide.',
}

export const encryptedMessage: Translation = {
    en: '[encrypted message]',
    de: '[verschlüsselte Nachricht]',
    fr: '[message message encrypté]',
}

export const pressOKJitsi: Translation = {
    'en_di': 'Press OK to start or join a videoconference with the user in this conversation.',
    'en_gr': 'Press OK to start or join a videoconference with the members of this group.',
    'de_di': 'Drücken Sie OK, um eine Videokonferenz mit dem Benutzer in diesem Chat zu starten oder daran teilzunehmen.',
    'de_gr': 'Drücken Sie OK, um eine Videokonferenz mit den Mitgliedern dieser Gruppe zu starten oder daran teilzunehmen.',
    'fr_di': 'Appuyez sur OK pour lancer ou joindre une vidéoconférence avec l\'usager dans cette conversation.',
    'fr_gr': 'Appuyez sur OK pour lancer ou joindre une vidéoconférence avec les membres de ce groupe.',
}

export const jitsiStartedExternal: Translation = {
    en: 'Videoconference started / joined. Join on ' + APP_NAME + ' by pressing the video icon, or in an external browser by using this link:\n\n' + JITSI_SERVER_URL,
    de: 'Videokonferenz gestartet / beigetreten. Nehmen Sie bei ' + APP_NAME + ' teil, indem Sie das Videosymbol drücken, oder in einem externen Browser über diesen Link:\n\n' + JITSI_SERVER_URL,
    fr: 'Vidéoconférence lancée / jointe. Participez sur ' + APP_NAME + ' en appuyant sur l\'icône vidéo, ou dans un navigateur externe en utilisant ce lien:\n\n' + JITSI_SERVER_URL,
}

export const jitsiStartedInternal: Translation = {
    en: 'Videoconference started / joined. Press the video icon next to the message input field to also join.',
    de: 'Videokonferenz gestartet / beigetreten. Drücken Sie auf das Videosymbol neben dem Texteingabefeld, um ebenfalls teilzunehmen.',
    fr: 'Vidéoconférence lancée / jointe. Appuyez sur l\'icône vidéo à côté du champ de saisie du message pour vous joindre également.',
}

export const jitsiStartedShort: Translation = {
    en: 'Videoconference started...',
    de: 'Videokonferenz gestartet...',
    fr: 'Vidéoconférence lancée...',
}

export const youHaveLeftRoom1: Translation = {
    en_di: 'You have now left the private conversation with ',
    en_gr: 'You have now left the group ',
    en_co: 'You have now left the public group ',
    en_no: 'The notepad ',
    de_di: 'Sie haben nun den privaten Chat mit ',
    de_gr: 'Sie haben nun den Gruppenchat ',
    de_co: 'Sie haben nun die öffentliche Gruppe ',
    de_no: 'Der Notizblock ',
    fr_di: 'Vous avez quitté la conversation privée avec ',
    fr_gr: 'Vous avez quitté le groupe ',
    fr_co: 'Vous avez quitté le groupe public ',
    fr_no: 'Le bloc-notes ',
}

export const youHaveLeftRoom2: Translation = {
    en_di: '.',
    en_gr: '.',
    en_co: '.',
    en_no: ' has been deleted.',
    de_di: ' verlassen.',
    de_gr: ' verlassen.',
    de_co: ' verlassen.',
    de_no: ' wurde gelöscht.',
    fr_di: '.',
    fr_gr: '.',
    fr_co: '.',
    fr_no: ' a été supprimé.',
}

export const warningNoSelfDirect: Translation = {
    en: 'Error: The user ID is not valid.',
    de: 'Fehler: Die Benutzer-ID ist nicht gültig.',
    fr: 'L\'ID d\'usager n\'est pas valide.',
}

export const syncError: Translation = {
    en: 'The app cannot seem to obtain data from the server. The problem is most likely on the server side. You can still try to logout, close and restart the app.',
    de: 'Die App scheint keine Daten vom Server zu erhalten. Das Problem liegt wahrscheinlich auf der Serverseite. Sie können trotzdem versuchen, sich abzumelden, die App zu schließen und neu zu starten.',
    fr: 'L\'application ne semble pas pouvoir obtenir de données du serveur. Le problème se situe probablement du côté du serveur. Vous pouvez toujours essayer de vous déconnecter, de fermer et de redémarrer l\'application.',
}

export const batteryOptimizationTitle: Translation = {
    en: 'Battery Optimization Whitelist',
    de: 'Whitelist für Batterie-Optimierung',
    fr: 'Whitelist pour l\'optimisation de la batterie'
}

export const batteryOptimizationText: Translation = {
    en: 'To enable push notifications for new messages, please whitelist quadrix from the battery optimization settings',
    de: 'Um Push-Benachrichtigungen für neue Nachrichten zu aktivieren, nehmen Sie quadrix in den Einstellungen zur Batterieoptimierung auf die Whitelist',
    fr: 'Pour activer les notifications en mode "push" pour les nouveaux messages, veuillez mettre quadrix sur la whitelist dans les paramètres d\'optimisation de la batterie'
}

export const doNotShowAgain: Translation = {
    en: 'Do not show again',
    de: 'Nicht mehr anzeigen',
    fr: 'Ne pas montrer de nouveau'
}

export const whitelist: Translation = {
    en: 'Whitelist',
    de: 'Whitelist',
    fr: 'Whitelist'
}
