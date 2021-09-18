export interface ExifInfo {
    ImageWidth: number;
    ImageHeight: number;
    Orientation: number;
    originalUri: string;
    exif: undefined;
}

interface Exif {

    getExif(uri: string): Promise<ExifInfo>;
}

declare const Exif: Exif;

export default Exif;
