import { Credentials } from '../../models/Credentials';
import { PREFIX_UPLOAD, APP_NAME } from '../../appconfig';
import axios from 'axios';
import UiStore from '../../stores/UiStore';
import { save } from '../../translations';
import utils from '../../utils/Utils';
import ApiClient from '../../matrix/ApiClient';
import { MessageEvent } from '../../models/MessageEvent';
import Resizer from 'react-image-file-resizer';
import { remote, shell, SaveDialogSyncOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';

declare global {
    interface Window {
        require(module: 'remote'): typeof remote;
        require(module: 'shell'): typeof shell;
        require(module: 'path'): typeof path;
        require(module: 'fs'): typeof fs;
    }
}

class FileHandler {

    public saveFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onAbort: () => void): void {

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;

        const { remote } = window.require('electron');
        const path = window.require('path');
        const fs = window.require('fs');

        const homePath = remote.app.getPath('home');
        const defaultPath = path.join(homePath, fileName!);

        const options: SaveDialogSyncOptions = {
            title: save[UiStore.getLanguage()],
            defaultPath: defaultPath,
            properties: ['showOverwriteConfirmation', 'createDirectory'],
        }

        const savePath = remote.dialog.showSaveDialogSync(options);

        if (!savePath) {
            onAbort();
            return;
        }

        axios.request({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent: {loaded: number, total: number}) => {
                fetchProgress(progressEvent.loaded / progressEvent.total);
            },
        })
            .then(response => {

                const fileData = new Uint8Array(Buffer.from(response.data));

                const onComplete = (error: NodeJS.ErrnoException) => {
                    error ? onSuccess(false) : onSuccess(true);
                }

                fs.writeFile(savePath, fileData, onComplete);

            })
            .catch(_error => {
                onSuccess(false);
            });
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        const url = utils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
        const fileName = message.content.body;
        const mimeType = message.content.info!.mimetype;

        const isElectron = UiStore.getIsElectron();

        axios.request({
            url: url,
            method: 'GET',
            responseType: isElectron ? 'arraybuffer' : 'blob',
            onDownloadProgress: function(progressEvent: {loaded: number, total: number}) {
                fetchProgress(progressEvent.loaded / progressEvent.total);
            },
        })
            .then(response => {

                if (isElectron) {

                    const { remote, shell } = window.require('electron');
                    const path = window.require('path');
                    const fs = window.require('fs');
                    const cachePath = remote.app.getPath('cache');
                    const cacheAppFolder = path.join(cachePath, APP_NAME);

                    if (!fs.existsSync(cacheAppFolder)) {
                        fs.mkdirSync(cacheAppFolder);
                    }

                    const filePath = path.join(cacheAppFolder, fileName!);
                    const fileData = new Uint8Array(Buffer.from(response.data));

                    const onComplete = (error: NodeJS.ErrnoException) => {

                        if (error) {
                            onSuccess(false);
                        } else {
                            onSuccess(true);

                            shell.openPath(filePath)
                                .then(() => {
                                    setTimeout(fs.unlinkSync, 10000, filePath);
                                })
                                .catch(() => {
                                    onNoAppFound();
                                });
                        }
                    }

                    fs.writeFile(filePath, fileData, onComplete);

                } else {

                    const blob = new Blob([response.data], { type: mimeType });
                    const uri = window.URL.createObjectURL(blob);

                    const aElement = document.createElement('a');
                    aElement.href = uri;
                    aElement.setAttribute('download', fileName!);
                    document.body.appendChild(aElement);
                    aElement.click();
                    document.body.removeChild(aElement);

                    onSuccess(true);
                }
            })
            .catch(() => {
                onSuccess(false);
            });
    }

    public pickFile(onlyImages?: boolean): Promise<FileObject> {

        const inputElement = document.createElement('input');

        inputElement.type = 'file';
        inputElement.multiple = false;
        onlyImages ? inputElement.accept = 'image/*' : null;
        inputElement.style.visibility = 'hidden';
        inputElement.style.position = 'absolute';
        inputElement.style.height = '0';

        document.body.appendChild(inputElement);

        return new Promise(resolve => {

            inputElement.onchange = async () => {

                const uri = URL.createObjectURL(inputElement.files![0]);

                let imageSize: { width: number, height: number };
                if (inputElement.files![0].type.includes('image')) {
                    imageSize = await ImageSizeLocal.getSize(uri);
                } else {
                    imageSize = { width: 0, height: 0 }
                }

                const file: FileObject = {
                    size: inputElement.files![0].size,
                    name: inputElement.files![0].name,
                    type: inputElement.files![0].type,
                    uri: uri,
                    object: inputElement.files![0],
                    imageWidth: imageSize.width,
                    imageHeight: imageSize.height,
                }

                document.body.removeChild(inputElement);
                resolve(file);
            }

            inputElement.click();
        });
    }

    public pickImage(): Promise<FileObject | null> {
        return Promise.resolve(null);
    }

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (progress: number) => void): Promise<string> {

        const axiosInstance = axios.create({
            baseURL: 'https://' + credentials.homeServer,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + credentials.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        axiosInstance.defaults.headers.post['Content-Type'] = 'application/octet-stream';

        const config = {
            onUploadProgress: function(progressEvent: { loaded: number, total: number }) {
                fetchProgress(progressEvent.loaded / progressEvent.total);
            }
        };

        const blob = new Blob([file.object!], { type: file.object!.type });

        let resizedImage;
        if (file.type.includes('image')) {

            let imageType: string | undefined;
            if (file.type.toLowerCase().includes('jpg')) {
                imageType = 'JPEG';
            } else if (file.type.toLowerCase().includes('jpeg')) {
                imageType = 'JPEG';
            } else if (file.type.toLowerCase().includes('png')) {
                imageType = 'PNG';
            } else if (file.type.toLowerCase().includes('webp')) {
                imageType = 'JPEG';
            }

            if (imageType) {

                const resizeImage = (blob: Blob): Promise<string | File | Blob | ProgressEvent<FileReader>> => {

                    return new Promise(resolve => {
                        Resizer.imageFileResizer(
                            blob,
                            1280,
                            1280,
                            imageType!,
                            98,
                            0,
                            uri => resolve(uri),
                            'blob'
                        );
                    });
                }

                resizedImage = await resizeImage(blob).catch(_error => null);
            }
        }

        const response: { status: number, data: { content_uri: string }} = await axiosInstance
            .post(PREFIX_UPLOAD, resizedImage || blob, config)
            .catch(error => { return Promise.reject(error) });

        if (response.status === 200) {
            return Promise.resolve(response.data.content_uri);
        } else {
            return Promise.reject(response);
        }
    }
}

export default new FileHandler();
