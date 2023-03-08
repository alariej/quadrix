import { CallEventContent_ } from './MatrixApi';

export interface Msc3401Call {
	startTime?: number;
	callId: string;
	callEventContent?: CallEventContent_;
	participants?: { [id: string]: boolean };
}

export type Msc3401CallStatus = 'none' | 'joined' | 'ringing';
