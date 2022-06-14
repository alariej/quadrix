export interface ThumbnailInfo {
	mimeType: string;
	fileSize: number;
	height: number;
	width: number;
}

export interface UploadFileInfo {
	uri: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	thumbnailUrl?: string;
	thumbnailInfo?: ThumbnailInfo;
}
