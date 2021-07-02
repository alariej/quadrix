import RNFetchBlob from 'rn-fetch-blob'
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import { MessageEvent } from '../../models/MessageEvent';
import utils from '../../utils/Utils';
import ApiClient from '../../matrix/ApiClient';
import ImageResizer, { Response as ImageResizerResponse, ResizeFormat } from "react-native-image-resizer";
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';

class FileHandler {

    public saveFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, _onAbort: () => void): void {

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;

        RNFetchBlob.config({
            fileCache: true,
            path: RNFetchBlob.fs.dirs.DocumentDir + '/' + fileName,
        })
            .fetch('GET', url, { 'Content-Type' : 'octet-stream' })
            .progress({ interval: 250 }, (received, total) => {
                fetchProgress(received / total);
            })
            .then(_response => {
                onSuccess(true);
            })
            .catch(_error => {
                onSuccess(false);
            });
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;

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

                setTimeout(() => {
                    RNFetchBlob.ios.openDocument(filePath)
                        .catch(_error => {
                            onNoAppFound();
                        })
                }, 500);
            })
            .catch((_error) => {
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

        console.log(file);

        return Promise.resolve(file);
    }

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (progress: number) => void): Promise<string> {

        let resizedImage: ImageResizerResponse | null;
        if (file.type.includes('image')) {

            let imageType: ResizeFormat | undefined;
            if (file.type.toLowerCase().includes('jpg')) {
                imageType = 'JPEG';
            } else if (file.type.toLowerCase().includes('jpeg')) {
                imageType = 'JPEG';
            } else if (file.type.toLowerCase().includes('png')) {
                imageType = 'PNG';
            }

            if (imageType) {

                resizedImage = await ImageResizer.createResizedImage(
                    file.uri,
                    1280,
                    1280,
                    imageType,
                    98,
                    0,
                ).catch(_error => null);
            }
        }

        const url = 'https://' + credentials.homeServer + PREFIX_UPLOAD;

        const response: { respInfo: { status: number }, data: string} = await RNFetchBlob.fetch('POST', url, {

            Authorization: 'Bearer ' + credentials.accessToken,
            'Content-Type': 'application/octet-stream',

        }, RNFetchBlob.wrap(resizedImage! ? resizedImage.path : file.uri.replace('file://', '')))
            .uploadProgress({ interval : 100 }, (written, total) => {
                fetchProgress(written / total);
            })
            .catch(error => { return Promise.reject(error) });

        setTimeout(() => {
            RNFetchBlob.fs.unlink(resizedImage ? resizedImage.uri : '').catch(_error => null);
        }, 5000);

        if (response.respInfo.status === 200) {
            const data = JSON.parse(response.data) as { content_uri: string };
            return Promise.resolve(data.content_uri);
        } else {
            return Promise.reject(response);
        }
    }
}

export default new FileHandler();
