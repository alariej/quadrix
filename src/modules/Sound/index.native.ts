import RNSound from 'react-native-sound';

class Sound {
	public play(name: string) {
		RNSound.setCategory('Playback');
		const sound = new RNSound(name + '.wav', RNSound.MAIN_BUNDLE, () => {
			

			// Mixwithothers needed to prevent music from stopping

			
			sound.play(() => {
				sound.release();
			});
		});
	}
}

export default new Sound();
