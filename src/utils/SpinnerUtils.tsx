import React from 'react';
import RX from 'reactxp';
import ModalSpinner from '../components/ModalSpinner';
import { MIN_MS } from '../ui';

class SpinnerUtils {
	private modalTimer: { [id: string]: Date } = {};

	public showModalSpinner = (id: string, backgroundColor?: string) => {
		this.modalTimer[id] = new Date();
		RX.Modal.show(<ModalSpinner backgroundColor={backgroundColor || undefined} />, id);
	};

	public dismissModalSpinner = (id: string) => {
		if (!this.modalTimer[id]) {
			return;
		}

		const d = new Date();
		const t = d.getTime() - this.modalTimer[id].getTime();

		if (t > MIN_MS) {
			RX.Modal.dismiss(id);
		} else {
			setTimeout(() => {
				RX.Modal.dismiss(id);
			}, MIN_MS - t);
		}
	};

	public isDisplayed = (id: string): boolean => {
		return RX.Modal.isDisplayed(id);
	};
}

export default new SpinnerUtils();
