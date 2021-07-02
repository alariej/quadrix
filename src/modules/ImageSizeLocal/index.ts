import RX from 'reactxp';

class ImageSizeLocal {

    public async getSize(uri: string): Promise<{ width: number, height: number }> {

        const imageSize = await RX.Image.getMetadata(uri);
        if (imageSize) {
            return { width: imageSize.width, height: imageSize.height }
        } else {
            return { width: 200, height: 200 }
        }
    }
}

export default new ImageSizeLocal();
