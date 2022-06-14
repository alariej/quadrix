export interface FileObject {
	uri: string;
	name: string;
	type: string;
	size?: number | null;
	object?: File;
	imageWidth?: number;
	imageHeight?: number;
}
