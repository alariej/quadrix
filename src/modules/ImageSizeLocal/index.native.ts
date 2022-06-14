import { Image } from 'react-native';

class ImageSizeLocal {
	public getSize(uri: string): Promise<{ width: number; height: number }> {
		return new Promise(resolve => {
			const returnSize = (width: number, height: number) => {
				resolve({ width: width, height: height });
			};
			const returnDefault = () => {
				resolve({ width: 200, height: 200 });
			};
			Image.getSize(uri, returnSize, returnDefault);
		});
	}
}

export default new ImageSizeLocal();
