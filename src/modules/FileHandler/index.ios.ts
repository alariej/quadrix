import ReactNativeBlobUtil from 'react-native-blob-util';
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import { MessageEvent } from '../../models/MessageEvent';
import ApiClient from '../../matrix/ApiClient';
import { FileObject } from '../../models/FileObject';
import ImageSizeLocal from '../ImageSizeLocal';
import * as ImagePicker from 'react-native-image-picker';
import { compressingVideo, uploadingFile } from '../../translations';
import UiStore from '../../stores/UiStore';
import { Video, Image } from 'react-native-compressor';
import { ThumbnailInfo, UploadFileInfo } from '../../models/UploadFileInfo';
import { createThumbnail } from 'react-native-create-thumbnail';
import StringUtils from '../../utils/StringUtils';

class FileHandler {
	public cacheAppFolder = '';

	public setCacheAppFolder(): void {
		this.cacheAppFolder = ReactNativeBlobUtil.fs.dirs.CacheDir;
	}

	public clearCacheAppFolder(): void {
		ReactNativeBlobUtil.fs
			.exists(this.cacheAppFolder)
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

	private async downloadFile(
		message: MessageEvent,
		filePath: string,
		fetchProgress: (progress: number) => void
	): Promise<void> {
		const url = StringUtils.mxcToHttp(message.content.url!, ApiClient.credentials.homeServer);

		await ReactNativeBlobUtil.config({
			overwrite: true,
			path: filePath,
		})
			.fetch('GET', url, { 'Content-Type': 'octet-stream' })
			.progress({ interval: 250 }, (received, total) => {
				fetchProgress(received / total);
			})
			.then(_response => {
				return Promise.resolve();
			})
			.catch(_error => {
				return Promise.reject();
			});
	}

	private async cacheFile(message: MessageEvent, fetchProgress: (progress: number) => void): Promise<string> {
		const cachedFileName = StringUtils.getCachedFileName(message, ApiClient.credentials.homeServer);
		const cachedFilePath = this.cacheAppFolder + '/' + cachedFileName;

		const alreadyCached = await ReactNativeBlobUtil.fs.exists(cachedFilePath);

		if (!alreadyCached) {
			await this.downloadFile(message, cachedFilePath, fetchProgress).catch(_error => {
				return Promise.reject();
			});
		}

		return Promise.resolve(cachedFilePath);
	}

	public async saveFile(
		message: MessageEvent,
		onSuccess: (success: boolean, fileName?: string) => void,
		_onAbort: () => void
	): Promise<void> {
		const fetchProgress = (_progress: number) => null;

		const cachedFilePath = await this.cacheFile(message, fetchProgress).catch(_error => {
			onSuccess(false);
			return Promise.reject();
		});

		const fileName = message.content.body;
		const homePath = ReactNativeBlobUtil.fs.dirs.DocumentDir;
		const homeFilePath = homePath + '/' + fileName;

		const alreadyCopied = await ReactNativeBlobUtil.fs.exists(homeFilePath);

		if (!alreadyCopied) {
			await ReactNativeBlobUtil.fs.cp(cachedFilePath, homeFilePath).catch(_error => {
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

	public viewFile(
		message: MessageEvent,
		fetchProgress: (progress: number) => void,
		onSuccess: (success: boolean) => void,
		_onNoAppFound: () => void
	): void {
		this.cacheFile(message, fetchProgress)
			.then(response => {
				onSuccess(true);

				setTimeout(() => {
					// submit PR to react-native-blob-util?
					ReactNativeBlobUtil.ios.openDocument(response);
					/*
                    ReactNativeBlobUtil.ios.openDocument(response)
                        .catch(_error => {
                            onNoAppFound();
                        })
                    */
				}, 250);
			})
			.catch(_error => onSuccess(false));
	}

	public async pickFile(onlyImages?: boolean): Promise<FileObject> {
		const response = await DocumentPicker.pickSingle({
			type: [onlyImages ? DocumentPicker.types.images : DocumentPicker.types.allFiles],
		});

		let imageSize: { width: number; height: number };
		if (response.type && response.type.startsWith('image')) {
			imageSize = await ImageSizeLocal.getSize(response.uri);
		} else {
			imageSize = { width: 0, height: 0 };
		}

		const file: FileObject = {
			size: response.size,
			name: response.name,
			type: response.type || 'unknown',
			uri: response.uri,
			imageWidth: imageSize.width,
			imageHeight: imageSize.height,
		};

		return Promise.resolve(file);
	}

	public pickImage(): Promise<FileObject> {
		return new Promise((resolve, reject) => {
			const setFile: ImagePicker.Callback = response => {
				if (response.didCancel) {
					return reject();
				}

				const file: FileObject = {
					size: response.assets![0].fileSize,
					name: response.assets![0].fileName || '',
					type: response.assets![0].type || 'unknown',
					uri: response.assets![0].uri || '',
					imageWidth: response.assets![0].width,
					imageHeight: response.assets![0].height,
				};

				return resolve(file);
			};

			const options: ImagePicker.ImageLibraryOptions = {
				maxHeight: 800,
				maxWidth: 800,
				selectionLimit: 1,
				mediaType: 'photo',
			};

			ImagePicker.launchImageLibrary(options, setFile).catch(_error => null);
		});
	}

	public async uploadFile(
		credentials: Credentials,
		file: FileObject,
		fetchProgress: (text: string, progress: number) => void,
		_isIntent = false
	): Promise<UploadFileInfo> {
		const url = 'https://' + credentials.homeServer + PREFIX_UPLOAD;

		let fileName: string | undefined;
		let fileSize: number | undefined;
		let mimeType: string | undefined;
		let thumbnailUrl: string | undefined;
		let thumbnailInfo: ThumbnailInfo | undefined;

		let compressedUri: string | null;
		if (file.type.includes('image')) {
			compressedUri = await Image.compress(file.uri, {
				compressionMethod: 'auto',
			});

			if (compressedUri) {
				file.uri = compressedUri;
			}
		} else if (file.type.includes('video')) {
			const compressionProgress = (progress: number) => {
				fetchProgress(compressingVideo[UiStore.getLanguage()], progress);
			};

			compressedUri = await Video.compress(
				file.uri,
				{
					compressionMethod: 'auto',
					maxSize: 1024,
					minimumFileSizeForCompress: 5,
				},
				compressionProgress
			).catch(_err => null);

			if (compressedUri) {
				const stat = await ReactNativeBlobUtil.fs
					.stat(compressedUri.replace('file://', ''))
					.catch(_err => null);

				file.uri = compressedUri;
				fileName = file.name.split('.')[0] + '.mp4';
				fileSize = stat?.size;
				mimeType = 'video/mp4';
			}

			const thumbnail = await createThumbnail({ url: file.uri }).catch();

			if (thumbnail) {
				thumbnailInfo = {
					mimeType: thumbnail.mime,
					fileSize: thumbnail.size,
					height: thumbnail.height,
					width: thumbnail.width,
				};

				const fetchPost: { respInfo: { status: number }; data: string } = await ReactNativeBlobUtil.fetch(
					'POST',
					url,
					{
						Authorization: 'Bearer ' + credentials.accessToken,
						'Content-Type': 'application/octet-stream',
					},
					ReactNativeBlobUtil.wrap(thumbnail.path)
				)
					.uploadProgress({ interval: 100 }, (_written, _total) => {
						// not used in this case
					})
					.catch(error => {
						return Promise.reject(error);
					})
					.finally(() => {
						ReactNativeBlobUtil.fs.unlink(thumbnailUrl!).catch(_error => null);
					});

				if (fetchPost.respInfo.status === 200) {
					const data = JSON.parse(fetchPost.data) as { content_uri: string };
					thumbnailUrl = data.content_uri;
				}
			}
		}

		const response: { respInfo: { status: number }; data: string } = await ReactNativeBlobUtil.fetch(
			'POST',
			url,
			{
				Authorization: 'Bearer ' + credentials.accessToken,
				'Content-Type': 'application/octet-stream',
			},
			ReactNativeBlobUtil.wrap(file.uri.replace('file://', ''))
		)
			.uploadProgress({ interval: 100 }, (written, total) => {
				fetchProgress(uploadingFile[UiStore.getLanguage()], written / total);
			})
			.catch(error => {
				return Promise.reject(error);
			})
			.finally(() => {
				if (compressedUri) {
					ReactNativeBlobUtil.fs.unlink(compressedUri).catch(_error => null);
				}
			});

		if (response.respInfo.status === 200) {
			const data = JSON.parse(response.data) as { content_uri: string };

			const uploadFileInfo: UploadFileInfo = {
				uri: data.content_uri,
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
