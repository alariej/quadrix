export interface FileObject {
    uri: string,
    name: string,
    type: string,
    size?: number | null,
    path?: string,
    object?: File,
    imageWidth?: number,
    imageHeight?: number,
}
