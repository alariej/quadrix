import ReactNativeBlobUtil from 'react-native-blob-util'
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import { MessageEvent } from '../../models/MessageEvent';
import EventUtils from '../../utils/EventUtils';
import ApiClient from '../../matrix/ApiClient';
import ImageResizer, { Response as ImageResizerResponse, ResizeFormat } from 'react-native-image-resizer';
import { FileObject } from '../../models/FileObject';
import { PermissionsAndroid, PermissionStatus } from 'react-native';
import ImageSizeLocal from '../ImageSizeLocal';
import Exif from 'react-native-exif';
import { Video } from 'react-native-compressor';
import { compressingVideo, uploadingFile } from '../../translations';
import UiStore from '../../stores/UiStore';
import { FileSystem } from 'react-native-file-access';

export interface UploadResponse {
    uri: string;
    fileName: string | undefined;
    fileSize: number | undefined;
    mimeType: string | undefined;
}

class FileHandler {

    public cacheAppFolder = '';

    public setCacheAppFolder(): void {
        this.cacheAppFolder = ReactNativeBlobUtil.fs.dirs.CacheDir;
    }

    public clearCacheAppFolder(): void {

        ReactNativeBlobUtil.fs.exists(this.cacheAppFolder)
            .then(isCache => {
                if (isCache) {
                    return this.cacheAppFolder;
                } else {
                    throw 'no cache found';
                }
            })
            .then(cacheAppFolder => {
                return ReactNativeBlobUtil.fs.lstat(cacheAppFolder);
            })
            .then(cachedFiles => {
                for (const file of cachedFiles) {
                    ReactNativeBlobUtil.fs.unlink(file.path + file.filename).catch(_error => null);
                }
            })
            .catch(_error => null);
    }

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

    private async downloadFile(message: MessageEvent, filePath: string, fetchProgress: (progress: number) => void): Promise<void> {

        const url = EventUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);

        await ReactNativeBlobUtil.config({
            overwrite: true,
            path: filePath,
        })
            .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
            .progress({ interval: 250 }, (received, total) => {
                fetchProgress(received / total);
            })
            .then((_response) => {
                return Promise.resolve();
            })
            .catch(_error => {
                return Promise.reject();
            });
    }

    private async cacheFile(message: MessageEvent, fetchProgress: (progress: number) => void): Promise<string> {

        const cachedFileName = EventUtils.getCachedFileName(message, ApiClient.credentials.homeServer);
        const cachedFilePath = this.cacheAppFolder + '/' + cachedFileName;

        const alreadyCached = await ReactNativeBlobUtil.fs.exists(cachedFilePath);

        if (!alreadyCached) {
            await this.downloadFile(message, cachedFilePath, fetchProgress)
                .catch(_error => { return Promise.reject() });
        }

        return Promise.resolve(cachedFilePath);
    }

    public async saveFile(
        message: MessageEvent,
        onSuccess: (success: boolean, fileName?: string) => void,
        _onAbort: () => void
    ): Promise<void> {

        const isGranted = await this.requestWriteStoragePermission();

        if(!isGranted) { onSuccess(false); return; }

        const fetchProgress = (_progress: number) => null;

        const cachedFilePath = await this.cacheFile(message, fetchProgress)
            .catch(_error => {
                onSuccess(false);
                return Promise.reject();
            });

        const fileName = message.content.body?.replace(/\s/g, '');

        // uses the Android MediaStore API
        FileSystem.cpExternal(cachedFilePath, fileName!, 'downloads')
            .then(_response => {
                onSuccess(true, fileName);
                return Promise.resolve();
            })
            .catch(_error => {
                onSuccess(false);
                return Promise.reject();
            });
    }

    public openFileExplorer(onNoAppFound: () => void): void {

        const mimeType = 'vnd.android.document/directory'; // opens the Downloads app
        // const mimeType = '*/*'; // shows an application chooser

        ReactNativeBlobUtil.android.actionViewIntent('', mimeType)
            .catch(_error => onNoAppFound());
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        const mimeType = message.content.info!.mimetype;

        this.cacheFile(message, fetchProgress)
            .then(response => {

                onSuccess(true);

                ReactNativeBlobUtil.android.actionViewIntent(response, mimeType!)
                    .catch(_error => onNoAppFound());
            })
            .catch(_error => onSuccess(false) );
    }

    public async pickFile(onlyImages?: boolean): Promise<FileObject> {

        const response = await DocumentPicker.pickSingle({
            type: [onlyImages ? DocumentPicker.types.images : DocumentPicker.types.allFiles],
        });

        let imageSize: { width: number, height: number };
        if (response.type && response.type.startsWith('image')) {
            imageSize = await ImageSizeLocal.getSize(response.uri);
        } else {
            imageSize = { width: 0, height: 0 }
        }

        let uri: string | undefined;
        if (response.uri.startsWith('content://')) {
            const stat = await ReactNativeBlobUtil.fs.stat(response.uri).catch(_err => null);
            uri = 'file://' + stat?.path;
        } else {
            uri = response.uri;
        }

        const file: FileObject = {
            size: response.size,
            name: response.name,
            type: response.type || 'unknown',
            uri: uri,
            imageWidth: imageSize.width,
            imageHeight: imageSize.height,
        }

        return Promise.resolve(file);
    }

    public pickImage(): Promise<FileObject | null> {
        return Promise.resolve(null);
    }

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (text: string, progress: number) => void,
        isIntent = false): Promise<UploadResponse> {

        let fileName: string | undefined;
        let fileSize: number | undefined;
        let mimeType: string | undefined;

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
                90,
                rotation,
                undefined,
                false,
                { mode: 'contain', onlyScaleDown: true }
            ).catch(_error => null);

            if (resizedImage) {

                file.uri = resizedImage.uri;

                const ratio1 = file.imageHeight! / file.imageWidth!;
                const ratio2 = resizedImage.height / resizedImage.width;
                // console.log(file);
                // console.log(resizedImage);
                // console.log(ratio1);
                // console.log(ratio2);
                // console.log(Math.abs(ratio1 - ratio2));

                if (Math.abs(ratio1 - ratio2) > 0.1 && ratio1 !== 1) {

                    // some android phones still get here (Samsung S20)
                    // desperately rotate by an additional 90 degrees
                    // console.log('WRONG IMAGE ROTATION');

                    resizedImage = await ImageResizer.createResizedImage(
                        file.uri,
                        1280,
                        1280,
                        compressFormat,
                        90,
                        rotation + 90,
                        undefined,
                        false,
                        { mode: 'contain', onlyScaleDown: true }
                    ).catch(_error => null);

                    if (resizedImage) {
                        file.uri = resizedImage.uri;
                    }
                }
            }
        } else if (file.type.includes('video')) {

            const isGranted = await this.requestReadStoragePermission();
            if (!isGranted) { return Promise.reject(); }

            const compressionProgress = (progress: number) => {
                fetchProgress(compressingVideo[UiStore.getLanguage()], progress);
            };

            const response = await Video.compress(
                file.uri,
                {
                    compressionMethod: 'auto',
                    maxSize: 1024,
                    minimumFileSizeForCompress: 8,
                },
                compressionProgress)
                .catch(_err => null);

            if (response) {

                let uri = response;
                if (!response.includes('file:///')) {
                    uri = response?.replace('file://', 'file:///');
                }

                const stat = await ReactNativeBlobUtil.fs.stat(uri).catch(_err => null);

                file.uri = uri!;
                fileName = file.name.split('.')[0] + '.mp4';
                fileSize = stat?.size;
                mimeType = 'video/mp4';
            }
        }

        const url = 'https://' + credentials.homeServer + PREFIX_UPLOAD;

        const response: { respInfo: { status: number }, data: string} = await ReactNativeBlobUtil.fetch('POST', url, {

            Authorization: 'Bearer ' + credentials.accessToken,
            'Content-Type': 'application/octet-stream',

        }, ReactNativeBlobUtil.wrap(file.uri))
            .uploadProgress({ interval: 100 }, (written, total) => {
                fetchProgress(uploadingFile[UiStore.getLanguage()], written / total);
            })
            .catch(error => { return Promise.reject(error) })
            .finally(() => {
                if (resizedImage && resizedImage.uri) {
                    ReactNativeBlobUtil.fs.unlink(resizedImage.uri).catch(_error => null);
                }
            });

        if (response.respInfo.status === 200) {
            const data = JSON.parse(response.data) as { content_uri: string };

            const uploadResponse = {
                uri: data.content_uri,
                fileName: fileName,
                fileSize: fileSize,
                mimeType: mimeType
            }

            return Promise.resolve(uploadResponse);
        } else {
            return Promise.reject(response);
        }
    }
}

export default new FileHandler();
