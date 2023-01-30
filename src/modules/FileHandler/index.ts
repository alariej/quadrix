import { Credentials } from '../../models/Credentials';
import { PREFIX_UPLOAD, APP_NAME } from '../../appconfig';
import axios from 'axios';
import UiStore from '../../stores/UiStore';
import { save, uploadingFile } from '../../translations';
import ApiClient from '../../matrix/ApiClient';
import Resizer from 'react-image-file-resizer';
import { shell, SaveDialogSyncOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';
import { ThumbnailInfo, UploadFileInfo } from '../../models/UploadFileInfo';
import VideoThumbnail from '../VideoThumbnail';
import StringUtils from '../../utils/StringUtils';
import { FilteredChatEvent } from '../../models/FilteredChatEvent';
import { FileInfo_, ImageInfo_, MessageEventContent_, VideoInfo_ } from '../../models/MatrixApi';

declare global {
	interface Window {
		require(module: 'shell'): typeof shell;
		require(module: 'path'): typeof path;
		require(module: 'fs'): typeof fs;
	}
}

class FileHandler {
	public cacheAppFolder = '';

	// electron only
	public setCacheAppFolder(): void {
		const { ipcRenderer } = window.require('electron');
		const path = window.require('path');
		const fs = window.require('fs');

		ipcRenderer
			.invoke('getPath', 'cache')
			.then(response => {
				this.cacheAppFolder = path.join(response as string, APP_NAME);
				if (!fs.existsSync(this.cacheAppFolder)) {
					fs.mkdirSync(this.cacheAppFolder);
				}
			})
			.catch(_error => null);
	}

	// electron only
	public clearCacheAppFolder(): void {
		if (!UiStore.getIsElectron()) {
			return;
		}

		const fs = window.require('fs');
		const path = window.require('path');

		const isCache = fs.existsSync(this.cacheAppFolder);

		if (isCache) {
			const cachedFiles = fs.readdirSync(this.cacheAppFolder);

			for (const file of cachedFiles) {
				fs.unlinkSync(path.join(this.cacheAppFolder, file));
			}
		}
	}

	// electron only
	private async downloadFile(
		message: FilteredChatEvent,
		filePath: string,
		fetchProgress: (progress: number) => void
	): Promise<void> {
		const url = StringUtils.mxcToHttp(
			(message.content as MessageEventContent_).url!,
			ApiClient.credentials.homeServer
		);

		const response = await axios
			.request({
				url: url,
				method: 'GET',
				responseType: 'arraybuffer',
				onDownloadProgress: (progressEvent: { loaded: number; total: number }) => {
					fetchProgress(progressEvent.loaded / progressEvent.total);
				},
			})
			.catch(_error => {
				return Promise.reject();
			});

		const fileData = new Uint8Array(Buffer.from(response.data as ArrayBuffer));

		const fs = window.require('fs');

		const writeFile = (filePath: string, fileData: Uint8Array) =>
			new Promise(resolve => fs.writeFile(filePath, fileData, resolve));

		await writeFile(filePath, fileData).catch(_error => {
			return Promise.reject();
		});

		return Promise.resolve();
	}

	// electron only
	private async cacheFile(message: FilteredChatEvent, fetchProgress: (progress: number) => void): Promise<string> {
		const cachedFileName = StringUtils.getCachedFileName(message, ApiClient.credentials.homeServer);
		const path = window.require('path');
		const cachedFilePath = path.join(this.cacheAppFolder, cachedFileName);
		const fs = window.require('fs');

		if (!fs.existsSync(cachedFilePath)) {
			await this.downloadFile(message, cachedFilePath, fetchProgress).catch(_error => {
				return Promise.reject();
			});
		}

		return Promise.resolve(cachedFilePath);
	}

	// electron only
	public async saveFile(
		message: FilteredChatEvent,
		onSuccess: (success: boolean, fileName?: string) => void,
		onAbort: () => void
	): Promise<void> {
		const fetchProgress = (_progress: number) => null;

		const cachedFilePath = await this.cacheFile(message, fetchProgress).catch(_error => {
			onSuccess(false);
			return Promise.reject();
		});

		const fileName = (message.content as MessageEventContent_).body;

		const { ipcRenderer } = window.require('electron');
		const path = window.require('path');

		const homePath = (await ipcRenderer.invoke('getPath', 'downloads').catch(_error => null)) as string;
		const homeFilePath = path.join(homePath, fileName!);

		const options: SaveDialogSyncOptions = {
			title: save[UiStore.getLanguage()],
			defaultPath: homeFilePath,
			properties: ['showOverwriteConfirmation', 'createDirectory'],
		};

		const savePath = ipcRenderer.sendSync('showSaveDialog', options) as string;

		if (!savePath) {
			onAbort();
			return Promise.resolve();
		}

		const fs = window.require('fs');

		const copyFile = (filePath: string, savePath: string) =>
			new Promise(resolve => fs.copyFile(filePath, savePath, resolve));

		await copyFile(cachedFilePath, savePath).catch(_error => {
			onSuccess(false);
			return Promise.reject();
		});

		onSuccess(true);
		return Promise.resolve();
	}

	public openFileExplorer(_onNoAppFound: () => void): void {
		// not used
	}

	public viewFile(
		message: FilteredChatEvent,
		fetchProgress: (progress: number) => void,
		onSuccess: (success: boolean) => void,
		onNoAppFound: () => void
	): void {
		if (UiStore.getIsElectron()) {
			this.cacheFile(message, fetchProgress)
				.then(response => {
					const { shell } = window.require('electron');
					shell.openPath(response).catch(_error => onNoAppFound());
					fetchProgress(1);
					onSuccess(true);
				})
				.catch(_error => onSuccess(false));
		} else {
			const content = message.content as MessageEventContent_;
			const info = content.info as ImageInfo_ | VideoInfo_ | FileInfo_;
			const url = StringUtils.mxcToHttp(content.url!, ApiClient.credentials.homeServer);
			const fileName = content.body;
			const mimeType = info.mimetype;

			axios
				.request({
					url: url,
					method: 'GET',
					responseType: 'blob',
					onDownloadProgress: function (progressEvent: { loaded: number; total: number }) {
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
		onlyImages ? (inputElement.accept = 'image/*') : null;
		inputElement.style.visibility = 'hidden';
		inputElement.style.position = 'absolute';
		inputElement.style.height = '0';

		document.body.appendChild(inputElement);

		return new Promise(resolve => {
			inputElement.onchange = async () => {
				const uri = URL.createObjectURL(inputElement.files![0]);

				let imageSize: { width: number; height: number };
				if (inputElement.files![0].type.includes('image')) {
					imageSize = await ImageSizeLocal.getSize(uri);
				} else {
					imageSize = { width: 0, height: 0 };
				}

				const file: FileObject = {
					size: inputElement.files![0].size,
					name: inputElement.files![0].name,
					type: inputElement.files![0].type.toLowerCase(),
					uri: uri,
					object: inputElement.files![0],
					imageWidth: imageSize.width,
					imageHeight: imageSize.height,
				};

				document.body.removeChild(inputElement);
				resolve(file);
			};

			inputElement.click();
		});
	}

	public pickImage(): Promise<FileObject | null> {
		return Promise.resolve(null);
	}

	public async uploadFile(
		credentials: Credentials,
		file: FileObject,
		fetchProgress: (text: string, progress: number) => void,
		_isIntent = false
	): Promise<UploadFileInfo> {
		let fileName: string | undefined;
		let fileSize: number | undefined;
		let mimeType: string | undefined;
		let thumbnailUrl: string | undefined;
		let thumbnailInfo: ThumbnailInfo | undefined;

		const axiosInstance = axios.create({
			baseURL: 'https://' + credentials.homeServer,
		});

		axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + credentials.accessToken;

		const config = {
			onUploadProgress: function (progressEvent: { loaded: number; total: number }) {
				fetchProgress(uploadingFile[UiStore.getLanguage()], progressEvent.loaded / progressEvent.total);
			},
		};

		const blob = new Blob([file.object!], { type: file.object!.type });

		let resizedImage;
		if (file.type.includes('image') && !file.type.includes('svg')) {
			let compressFormat: string | undefined;
			if (file.type.includes('png') || file.name.toLowerCase().includes('.png')) {
				compressFormat = 'PNG';
			} else {
				compressFormat = 'JPEG';
			}

			const resizeImage = (blob: Blob): Promise<string | File | Blob | ProgressEvent<FileReader>> => {
				return new Promise(resolve => {
					Resizer.imageFileResizer(blob, 1280, 1280, compressFormat!, 90, 0, uri => resolve(uri), 'blob');
				});
			};

			resizedImage = await resizeImage(blob).catch(_error => null);
		} else if (file.type.includes('image') && file.type.includes('svg')) {
			const getThumbnail = (blob: Blob): Promise<string | File | Blob | ProgressEvent<FileReader>> => {
				return new Promise(resolve => {
					Resizer.imageFileResizer(blob, 1280, 1280, 'PNG', 90, 0, uri => resolve(uri), 'blob');
				});
			};

			const thumbnail = (await getThumbnail(blob).catch(_error => null)) as Blob;

			axiosInstance.defaults.headers.post['Content-Type'] = 'image/png';
			const fetchPost: { status: number; data: { content_uri: string } } = await axiosInstance
				.post(PREFIX_UPLOAD, thumbnail)
				.catch(error => {
					return Promise.reject(error);
				});

			thumbnailInfo = {
				mimeType: thumbnail.type,
				fileSize: thumbnail.size,
				height: file.imageHeight!,
				width: file.imageWidth!,
			};

			thumbnailUrl = fetchPost.data.content_uri;
		} else if (file.type.includes('video')) {
			const thumbnail = await VideoThumbnail.getImage(file.uri).catch();

			axiosInstance.defaults.headers.post['Content-Type'] = 'image/jpeg';
			const fetchPost: { status: number; data: { content_uri: string } } = await axiosInstance
				.post(PREFIX_UPLOAD, thumbnail.blob)
				.catch(error => {
					return Promise.reject(error);
				});

			thumbnailInfo = {
				mimeType: thumbnail.blob.type,
				fileSize: thumbnail.blob.size,
				height: thumbnail.height,
				width: thumbnail.width,
			};

			thumbnailUrl = fetchPost.data.content_uri;
		}

		axiosInstance.defaults.headers.post['Content-Type'] = file.type;
		const response: { status: number; data: { content_uri: string } } = await axiosInstance
			.post(PREFIX_UPLOAD, resizedImage || blob, config)
			.catch(error => {
				return Promise.reject(error);
			});

		if (response.status === 200) {
			const uploadFileInfo: UploadFileInfo = {
				uri: response.data.content_uri,
				fileName: fileName,
				fileSize: fileSize,
				mimeType: mimeType,
				thumbnailUrl: thumbnailUrl,
				thumbnailInfo: thumbnailInfo,
			};

			return Promise.resolve(uploadFileInfo);
		} else {
			return Promise.reject(response);
		}
	}
}

export default new FileHandler();
