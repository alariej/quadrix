class VideoThumbnail {

    public getImage(uri: string): Promise<{ blob: Blob, height: number, width: number }> {

        return new Promise(resolve => {

            const videoElement = document.createElement('video');
            videoElement.src = uri + '#t=0.001';

            videoElement.onloadeddata = async () => {

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                canvas.height = videoElement.videoHeight;
                canvas.width = videoElement.videoWidth;

                context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                const image = canvas.toDataURL('image/jpeg');

                const imageData = await fetch(image).catch();
                const imageBlob = await imageData.blob().catch();

                resolve({ blob: imageBlob, height: canvas.height, width: canvas.width });
            }

            videoElement.load()
        });
    }
}

export default new VideoThumbnail();
