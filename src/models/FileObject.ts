export interface FileObject {
    uri: string,
    name: string,
    type: string,
    size?: number,
    object?: File,
    imageWidth?: number,
    imageHeight?: number,
}
