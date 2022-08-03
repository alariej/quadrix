class AsyncStorage {
	public getItem(key: string): Promise<string | undefined> {
		const value = window.localStorage.getItem(key);
		return Promise.resolve<string | undefined>(value === null ? undefined : value);
	}

	public setItem(key: string, value: string): Promise<void> {
		try {
			window.localStorage.setItem(key, value);
		} catch (e) {
			return Promise.resolve(e);
		}
		return Promise.resolve<void>(void 0);
	}

	public removeItem(key: string): Promise<void> {
		window.localStorage.removeItem(key);
		return Promise.resolve<void>(void 0);
	}

	public clear(): Promise<void> {
		window.localStorage.clear();
		return Promise.resolve<void>(void 0);
	}
}

export default new AsyncStorage();
