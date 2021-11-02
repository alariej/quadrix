import { Credentials } from '../../models/Credentials';
import { PREFIX_UPLOAD, APP_NAME } from '../../appconfig';
import axios from 'axios';
import UiStore from '../../stores/UiStore';
import { save } from '../../translations';
import EventUtils from '../../utils/EventUtils';
import ApiClient from '../../matrix/ApiClient';
import { MessageEvent } from '../../models/MessageEvent';
import Resizer from 'react-image-file-resizer';
import { shell, SaveDialogSyncOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';

declare global {
    interface Window {
        require(module: 'shell'): typeof shell;
        require(module: 'path'): typeof path;
        require(module: 'fs'): typeof fs;
    }
}

class FileHandler {

    public cacheAppFolder = '';

    public setCacheAppFolder(): void {

        const { ipcRenderer } = window.require('electron');
        const path = window.require('path');
        const fs = window.require('fs');

        ipcRenderer.invoke('getPath', 'cache')
            .then(response => {
                this.cacheAppFolder = path.join(response as string, APP_NAME);
                if (!fs.existsSync(this.cacheAppFolder)) {
                    fs.mkdirSync(this.cacheAppFolder);
                }
            })
            .catch(_error => null);
    }

    private downloadFile(message: MessageEvent, filePath: string, fetchProgress: (progress: number) => void): void {

        const url = EventUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);

        axios.request({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent: {loaded: number, total: number}) => {
                fetchProgress(progressEvent.loaded / progressEvent.total);
            },
        })
            .then(response => {

                const fileData = new Uint8Array(Buffer.from(response.data as ArrayBuffer));

                const onComplete = (_error: NodeJS.ErrnoException) => {
                    // do nothing
                }

                const fs = window.require('fs');
                fs.writeFile(filePath, fileData, onComplete);
            })
            .catch(_error => null);
    }

    public cacheFile(message: MessageEvent, fetchProgress: (progress: number) => void): void {

        if (!UiStore.getIsElectron()) { return; }

        const cachedFileName = EventUtils.getCachedFileName(message, ApiClient.credentials.homeServer);

        const fs = window.require('fs');
        const path = window.require('path');

        const cachedFilePath = path.join(this.cacheAppFolder, cachedFileName);

        if (!fs.existsSync(cachedFilePath)) { this.downloadFile(message, cachedFilePath, fetchProgress); }
    }

    public async saveFile(message: MessageEvent, onSuccess: (success: boolean) => void, onAbort: () => void): Promise<void> {

        const fileName = message.content.body;

        const { ipcRenderer } = window.require('electron');
        const path = window.require('path');
        const fs = window.require('fs');

        const homePath = await ipcRenderer.invoke('getPath', 'home').catch(_error => null) as string;
        const homeFilePath = path.join(homePath, fileName!);

        const options: SaveDialogSyncOptions = {
            title: save[UiStore.getLanguage()],
            defaultPath: homeFilePath,
            properties: ['showOverwriteConfirmation', 'createDirectory'],
        }

        const savePath = ipcRenderer.sendSync('showSaveDialog', options) as string;

        if (!savePath) {
            onAbort();
            return;
        }

        const cachedFileName = EventUtils.getCachedFileName(message, ApiClient.credentials.homeServer);
        const cachedFilePath = path.join(this.cacheAppFolder, cachedFileName);

        const onComplete = (error: NodeJS.ErrnoException) => {
            error ? onSuccess(false) : onSuccess(true);
        }

        fs.copyFile(cachedFilePath, savePath, onComplete);
    }

    public viewFile(message: MessageEvent, fetchProgress: (progress: number) => void,
        onSuccess: (success: boolean) => void, onNoAppFound: () => void): void {

        if (UiStore.getIsElectron()) {

            const cachedFileName = EventUtils.getCachedFileName(message, ApiClient.credentials.homeServer);
            const fs = window.require('fs');
            const path = window.require('path');
            const cachedFilePath = path.join(this.cacheAppFolder, cachedFileName);

            if (fs.existsSync(cachedFilePath)) {
                const { shell } = window.require('electron');
                shell.openPath(cachedFilePath).catch(_error => onNoAppFound());
                fetchProgress(1);
                onSuccess(true);
            } else {
                onSuccess(false);
            }
        } else {

            const url = EventUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);
            const fileName = message.content.body;
            const mimeType = message.content.info!.mimetype;

            axios.request({
                url: url,
                method: 'GET',
                responseType: 'blob',
                onDownloadProgress: function(progressEvent: {loaded: number, total: number}) {
                    fetchProgress(progressEvent.loaded / progressEvent.total);
                },
            })
                .then(response => {

                    const blob = new Blob([response.data], { type: mimeType });
                    const uri = window.URL.createObjectURL(blob);

                    const aElement = document.createElement('a');
                    aElement.href = uri;
                    aElement.setAttribute('download', fileName!);
                    document.body.appendChild(aElement);
                    aElement.click();
                    document.body.removeChild(aElement);

                    onSuccess(true);
                })
                .catch(() => {
                    onSuccess(false);
                });
        }
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

    public async uploadFile(credentials: Credentials, file: FileObject, fetchProgress: (progress: number) => void,
        _isIntent = false): Promise<string> {

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

            let compressFormat: string | undefined;
            if (file.type.toLowerCase().includes('png') || file.name.toLowerCase().includes('.png')) {
                compressFormat = 'PNG';
            } else {
                compressFormat = 'JPEG';
            }

            const resizeImage = (blob: Blob): Promise<string | File | Blob | ProgressEvent<FileReader>> => {

                return new Promise(resolve => {
                    Resizer.imageFileResizer(
                        blob,
                        1280,
                        1280,
                        compressFormat!,
                        90,
                        0,
                        uri => resolve(uri),
                        'blob'
                    );
                });
            }

            resizedImage = await resizeImage(blob).catch(_error => null);
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
