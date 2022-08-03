import RNAsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorage {
	public getItem(key: string): Promise<string | null> {
		try {
			return RNAsyncStorage.getItem(key);
		} catch (error) {
			return Promise.resolve(null);
		}
	}

	public async setItem(key: string, value: string): Promise<void> {
		try {
			await RNAsyncStorage.setItem(key, value);
		} catch (error) {
			throw new Error(error);
		}
	}

	public async removeItem(key: string): Promise<void> {
		try {
			await RNAsyncStorage.removeItem(key);
		} catch (error) {
			throw new Error(error);
		}
	}

	public async clear(): Promise<void> {
		try {
			await RNAsyncStorage.clear();
		} catch (error) {
			throw new Error(error);
		}
	}
}

export default new AsyncStorage();
