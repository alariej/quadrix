import { differenceInDays } from 'date-fns';
import DataStore from '../stores/DataStore';
import { INACTIVE_DAYS } from '../appconfig';

class UserUtils {
	public userIsActive(userId: string): boolean {
		const lastSeenTime = DataStore.getLastSeenTime(userId);
		return differenceInDays(new Date(), lastSeenTime) < INACTIVE_DAYS;
	}

	public userIsActive_(userId: string): boolean {
		const lastSeenTime = DataStore.getLastSeenTime_(userId);
		return differenceInDays(new Date(), lastSeenTime) < INACTIVE_DAYS;
	}
}

export default new UserUtils();
