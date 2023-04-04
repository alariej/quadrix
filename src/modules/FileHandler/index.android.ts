import ReactNativeBlobUtil from 'react-native-blob-util';
import DocumentPicker from 'react-native-document-picker';
import { PREFIX_UPLOAD } from '../../appconfig';
import { Credentials } from '../../models/Credentials';
import ApiClient from '../../matrix/ApiClient';
import { FileObject } from '../../models/FileObject';
import { PermissionsAndroid, PermissionStatus } from 'react-native';
import ImageSizeLocal from '../ImageSizeLocal';
import { Video, Image } from 'react-native-compressor';
import { compressingVideo, uploadingFile } from '../../translations';
import UiStore from '../../stores/UiStore';
import { FileSystem } from 'react-native-file-access';
import { ThumbnailInfo, UploadFileInfo } from '../../models/UploadFileInfo';
import { createThumbnail } from 'react-native-create-thumbnail';
import StringUtils from '../../utils/StringUtils';
import * as ImagePicker from 'react-native-image-picker';
import { FilteredChatEvent } from '../../models/FilteredChatEvent';
import { FileInfo_, ImageInfo_, MessageEventContent_, VideoInfo_ } from '../../models/MatrixApi';

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

	private async requestWriteStoragePermission(): Promise<boolean> {
		const granted: PermissionStatus = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
		).catch(_error => {
			return 'denied';
		});

		return granted === PermissionsAndroid.RESULTS.GRANTED;
	}

	private async requestReadStoragePermission(): Promise<boolean> {
		const granted: PermissionStatus = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
		).catch(_error => {
			return 'denied';
		});

		return granted === PermissionsAndroid.RESULTS.GRANTED;
	}

	private async downloadFile(
		message: FilteredChatEvent,
		filePath: string,
		fetchProgress: (progress: number) => void
	): Promise<void> {
		const url = StringUtils.mxcToHttp(
			(message.content as MessageEventContent_).url!,
			ApiClient.credentials.homeServer
		);

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

	private async cacheFile(message: FilteredChatEvent, fetchProgress: (progress: number) => void): Promise<string> {
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
		message: FilteredChatEvent,
		onSuccess: (success: boolean, fileName?: string) => void,
		_onAbort: () => void
	): Promise<void> {
		const isGranted = await this.requestWriteStoragePermission();
		if (!isGranted) {
			onSuccess(false);
			return;
		}

		const fetchProgress = (_progress: number) => null;

		const cachedFilePath = await this.cacheFile(message, fetchProgress).catch(_error => {
			onSuccess(false);
			return Promise.reject();
		});

		const fileName = (message.content as MessageEventContent_).body?.replace(/\s/g, '');

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

		ReactNativeBlobUtil.android.actionViewIntent('', mimeType).catch(_error => onNoAppFound());
	}

	public async viewFile(
		message: FilteredChatEvent,
		fetchProgress: (progress: number) => void,
		onSuccess: (success: boolean) => void,
		onNoAppFound: () => void
	): Promise<void> {
		const isGranted = await this.requestWriteStoragePermission();
		if (!isGranted) {
			return Promise.reject();
		}

		const content = message.content as MessageEventContent_;
		const info = content.info as ImageInfo_ | VideoInfo_ | FileInfo_;
		const mimeType = info.mimetype;

		this.cacheFile(message, fetchProgress)
			.then(response => {
				onSuccess(true);

				ReactNativeBlobUtil.android.actionViewIntent(response, mimeType!).catch(_error => onNoAppFound());
			})
			.catch(_error => onSuccess(false));
	}

	public async pickFile(onlyImages?: boolean): Promise<FileObject> {
		const isGranted = await this.requestWriteStoragePermission();
		if (!isGranted) {
			return Promise.reject();
		}

		const response = await DocumentPicker.pickSingle({
			type: [onlyImages ? DocumentPicker.types.images : DocumentPicker.types.allFiles],
		});

		let imageSize: { width: number; height: number };
		if (response.type && response.type.startsWith('image')) {
			imageSize = await ImageSizeLocal.getSize(response.uri);
		} else {
			imageSize = { width: 0, height: 0 };
		}

		let uri: string | undefined;
		if (response.uri.startsWith('content://')) {
			const stat = await ReactNativeBlobUtil.fs.stat(response.uri).catch(_error => null);
			uri = 'file://' + stat?.path;
		} else {
			uri = response.uri;
		}

		const file: FileObject = {
			size: response.size,
			name: response.name || '',
			type: response.type?.toLowerCase() || 'unknown',
			uri: uri,
			imageWidth: imageSize.width,
			imageHeight: imageSize.height,
		};

		return Promise.resolve(file);
	}

	public pickImage(): Promise<FileObject> {
		return new Promise((resolve, reject) => {
			const setFile: ImagePicker.Callback = async response => {
				if (response.didCancel) {
					return reject();
				}

				let imageSize = { height: 0, width: 0 };
				if (response?.assets && response.assets[0].uri) {
					imageSize = await ImageSizeLocal.getSize(response.assets[0].uri);
				}

				const file: FileObject = {
					size: response.assets![0].fileSize,
					name: response.assets![0].fileName || '',
					type: response.assets![0].type?.toLowerCase() || 'unknown',
					uri: response.assets![0].uri || '',
					imageWidth: imageSize.width || response.assets![0].width,
					imageHeight: imageSize.height || response.assets![0].height,
				};

				return resolve(file);
			};

			const options: ImagePicker.ImageLibraryOptions = {
				quality: 0.9,
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
		if (file.type.includes('image') && !file.type.includes('svg')) {
			compressedUri = await Image.compress(file.uri, {
				compressionMethod: 'auto',
			});

			if (compressedUri) {
				file.uri = compressedUri;
			}
		} else if (file.type.includes('video')) {
			const isGranted = await this.requestReadStoragePermission();
			if (!isGranted) {
				return Promise.reject();
			}

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
			).catch(_error => null);

			if (compressedUri) {
				let uri = compressedUri;
				if (!compressedUri.includes('file:///')) {
					uri = compressedUri?.replace('file://', 'file:///');
				}

				const stat = await ReactNativeBlobUtil.fs.stat(uri).catch(_error => null);

				file.uri = uri!;
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
						'Content-Type': 'image/jpeg',
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

				let data;
				try {
					data = JSON.parse(fetchPost.data) as { content_uri: string };
				} catch (_error) {
					data = undefined;
				}

				if (data?.content_uri?.includes('mxc://')) {
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
				'Content-Type': file.type,
			},
			ReactNativeBlobUtil.wrap(file.uri)
		)
			.uploadProgress({ interval: 100 }, (written, total) => {
				fetchProgress(uploadingFile[UiStore.getLanguage()], total ? written / total : 0);
			})
			.catch(error => {
				return Promise.reject(error);
			})
			.finally(() => {
				if (compressedUri) {
					ReactNativeBlobUtil.fs.unlink(compressedUri).catch(_error => null);
				}
			});

		let data;
		try {
			data = JSON.parse(response.data) as { content_uri: string };
		} catch (_error) {
			data = undefined;
		}

		if (data?.content_uri?.includes('mxc://')) {
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
