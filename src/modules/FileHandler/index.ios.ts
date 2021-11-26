import RNFetchBlob from 'rn-fetch-blob'
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import { MessageEvent } from '../../models/MessageEvent';
import EventUtils from '../../utils/EventUtils';
import ApiClient from '../../matrix/ApiClient';
import ImageResizer, { Response as ImageResizerResponse, ResizeFormat } from "react-native-image-resizer";
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';
import * as ImagePicker from 'react-native-image-picker';

class FileHandler {

    public cacheAppFolder = '';

    public setCacheAppFolder(): void {
        this.cacheAppFolder = RNFetchBlob.fs.dirs.CacheDir;
    }

    public clearCacheAppFolder(): void {

        RNFetchBlob.fs.exists(this.cacheAppFolder)
            .then(isCache => {
                if (isCache) {
                    return this.cacheAppFolder;
                } else {
                    throw 'no cache found';
                }
            })
            .then(cacheAppFolder => {
                return RNFetchBlob.fs.lstat(cacheAppFolder);
            })
            .then(cachedFiles => {
                for (const file of cachedFiles) {
                    RNFetchBlob.fs.unlink(file.path + file.filename).catch(_error => null);
                }
            })
            .catch(_error => null);
    }

    private async downloadFile(message: MessageEvent, filePath: string, fetchProgress: (progress: number) => void): Promise<void> {

        const url = EventUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);

        await RNFetchBlob.config({
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

        const alreadyCached = await RNFetchBlob.fs.exists(cachedFilePath);

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

        const fetchProgress = (_progress: number) => null;

        const cachedFilePath = await this.cacheFile(message, fetchProgress)
            .catch(_error => {
                onSuccess(false);
                return Promise.reject();
            });

        const fileName = message.content.body;
        const homePath = RNFetchBlob.fs.dirs.DocumentDir;
        const homeFilePath = homePath + '/' + fileName;

        const alreadyCopied = await RNFetchBlob.fs.exists(homeFilePath);

        if (!alreadyCopied) {
            await RNFetchBlob.fs.cp(cachedFilePath, homeFilePath)
                .catch(_error => {
                    onSuccess(false);
                    return Promise.reject();
                });
        }

        onSuccess(true);
        return Promise.resolve();
    }

    public openFileExplorer(_onNoAppFound: () => void): void {
        // not used
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        this.cacheFile(message, fetchProgress)
            .then(response => {

                onSuccess(true);

                setTimeout(() => {
                    RNFetchBlob.ios.openDocument(response)
                        .catch(_error => {
                            onNoAppFound();
                        })
                }, 250);
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

        const file: FileObject = {
            size: response.size,
            name: response.name,
            type: response.type || 'unknown',
            uri: response.uri,
            imageWidth: imageSize.width,
            imageHeight: imageSize.height,
        }

        return Promise.resolve(file);
    }

    public pickImage(): Promise<FileObject> {

        return new Promise((resolve, reject) => {

            const setFile: ImagePicker.Callback = (response) => {

                if (response.didCancel) { return reject(); }

                const file: FileObject = {
                    size: response.assets![0].fileSize,
                    name: response.assets![0].fileName || '',
                    type: response.assets![0].type || 'unknown',
                    uri: response.assets![0].uri || '',
                    imageWidth: response.assets![0].width,
                    imageHeight: response.assets![0].height,
                }

                return resolve(file);
            }

            const options: ImagePicker.ImageLibraryOptions = {
                maxHeight: 800,
                maxWidth: 800,
                selectionLimit: 1,
                mediaType: 'photo',
            }

            ImagePicker.launchImageLibrary(options, setFile);
        });
    }

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (progress: number) => void,
        _isIntent = false): Promise<string> {

        let resizedImage: ImageResizerResponse | null;
        if (file.type.includes('image')) {

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
                0,
                undefined,
                false,
                { mode: 'contain', onlyScaleDown: true }
            ).catch(_error => null);

            if (resizedImage) {
                file.imageHeight = resizedImage.height;
                file.imageWidth = resizedImage.width;
                file.size = resizedImage.size;
                file.uri = resizedImage.path;
            }
        }

        const url = 'https://' + credentials.homeServer + PREFIX_UPLOAD;

        const response: { respInfo: { status: number }, data: string} = await RNFetchBlob.fetch('POST', url, {

            Authorization: 'Bearer ' + credentials.accessToken,
            'Content-Type': 'application/octet-stream',

        }, RNFetchBlob.wrap(file.uri.replace('file://', '')))
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
