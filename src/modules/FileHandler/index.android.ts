import RX from 'reactxp';
import RNFetchBlob from 'rn-fetch-blob'
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import { MessageEvent } from '../../models/MessageEvent';
import utils from '../../utils/Utils';
import ApiClient from '../../matrix/ApiClient';
import ImageResizer, { Response as ImageResizerResponse, ResizeFormat } from 'react-native-image-resizer';
import { FileObject } from '../../models/FileObject';
import { PermissionsAndroid, PermissionStatus } from 'react-native';
import ImageSizeLocal from '../ImageSizeLocal';
import Exif from 'react-native-exif';

class FileHandler {

    private async requestWriteStoragePermission(): Promise<boolean> {

        const granted: PermissionStatus =
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
                .catch(_error => { return 'denied' })

        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    private async requestReadStoragePermission(): Promise<boolean> {

        const granted: PermissionStatus =
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
                .catch(_error => { return 'denied' })

        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    public async saveFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, _onAbort: () => void): Promise<void> {

        const isGranted = await this.requestWriteStoragePermission();

        if(!isGranted) { onSuccess(false); return; }

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;
        const mimeType = message.content.info!.mimetype;

        RNFetchBlob.config({
            addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                mime: mimeType,
                path: RNFetchBlob.fs.dirs.DownloadDir + '/' + fileName,
            },
        })
            .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
            .progress({ interval: 250 }, (received, total) => {
                fetchProgress(received / total);
            })
            .then(() => {
                onSuccess(true);
            })
            .catch(() => {
                onSuccess(false);
            });
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;
        const mimeType = message.content.info!.mimetype;

        RNFetchBlob.config({
            overwrite: true,
            path: RNFetchBlob.fs.dirs.CacheDir + '/' + fileName,
        })
            .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
            .progress({ interval: 250 }, (received, total) => {
                fetchProgress(received / total);
            })
            .then((response) => {
                onSuccess(true);
                const filePath = response.path();

                RNFetchBlob.android.actionViewIntent(filePath, mimeType!)
                    .then(() => {

                        // HACK: to detect if there is a suitable app for viewing the file
                        // doesn't seem to work for some file types (something.xll)
                        if (RX.App.getActivationState() === 2) {
                            // app goes in the background
                            // assumption: file gets opened by an external app
                        } else {
                            onNoAppFound();
                        }

                        setTimeout(() => {
                            RNFetchBlob.fs.unlink(filePath).catch(_error => null);
                        }, 5000);
                    })
                    .catch(() => {
                        RNFetchBlob.fs.unlink(filePath).catch(_error => null);
                    });
            })
            .catch(() => {
                onSuccess(false);
            });
    }

    public async pickFile(onlyImages?: boolean): Promise<FileObject> {

        const response = await DocumentPicker.pick({
            type: [onlyImages ? DocumentPicker.types.images : DocumentPicker.types.allFiles],
        });

        let imageSize: { width: number, height: number };
        if (response.type && response.type.startsWith('image')) {
            imageSize = await ImageSizeLocal.getSize(response.uri);
        } else {
            imageSize = { width: 0, height: 0 }
        }

        const file = {
            size: response.size,
            name: response.name,
            type: response.type || 'unknown',
            uri: response.uri,
            imageWidth: imageSize.width,
            imageHeight: imageSize.height,
        }

        return Promise.resolve(file);
    }

    public pickImage(): Promise<FileObject | null> {
        return Promise.resolve(null);
    }

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (progress: number) => void,
        isIntent = false): Promise<string> {

        let resizedImage: ImageResizerResponse | null;
        if (file.type.includes('image')) {

            let rotation = 0;

            if (!isIntent) {

                const isGranted = await this.requestReadStoragePermission();
                if(!isGranted) { return Promise.reject(); }

                const exif = await Exif.getExif(file.uri).catch(_error => null);

                if (exif && exif.Orientation) {
                    switch (exif.Orientation) {
                        case 1:
                            rotation = 0;
                            break;

                        case 3:
                            rotation = 180;
                            break;

                        case 6:
                            rotation = 90;
                            break;

                        case 8:
                            rotation = 270;
                            break;

                        default:
                            rotation = 0;
                            break;
                    }
                }
            }

            let compressFormat: ResizeFormat | undefined;
            if (file.type.toLowerCase().includes('png') || file.name.toLowerCase().includes('.png')) {
                compressFormat = 'PNG';
            } else {
                compressFormat = 'JPEG';
            }

            resizedImage = await ImageResizer.createResizedImage(
                file.uri,
                1280,
                1280,
                compressFormat,
                95,
                rotation,
                undefined,
                false,
                { mode: 'contain', onlyScaleDown: true }
            ).catch(_error => null);

            if (resizedImage) {
                file.imageHeight = resizedImage.height;
                file.imageWidth = resizedImage.width;
                file.size = resizedImage.size;
                file.uri = resizedImage.uri;
            }
        }

        const url = 'https://' + credentials.homeServer + PREFIX_UPLOAD;

        const response: { respInfo: { status: number }, data: string} = await RNFetchBlob.fetch('POST', url, {

            Authorization: 'Bearer ' + credentials.accessToken,
            'Content-Type': 'application/octet-stream',

        }, RNFetchBlob.wrap(file.uri))
            .uploadProgress({ interval: 100 }, (written, total) => {
                fetchProgress(written / total);
            })
            .catch(error => { return Promise.reject(error) })
            .finally(() => {
                if (resizedImage && resizedImage.uri) {
                    RNFetchBlob.fs.unlink(resizedImage.uri).catch(_error => null);
                }
            });

        if (response.respInfo.status === 200) {
            const data = JSON.parse(response.data) as { content_uri: string };
            return Promise.resolve(data.content_uri);
        } else {
            return Promise.reject(response);
        }
    }
}

export default new FileHandler();
