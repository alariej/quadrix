import { RoomPhase } from './MatrixApi';

// TODO: rename this 'member'
export interface User {
	id: string;
	name?: string;
	avatarUrl?: string;
	emailAddress?: string;
	membership?: RoomPhase;
	url?: string;
	powerLevel?: number;
	isDirect?: boolean;
}
