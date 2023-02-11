import { CallEventContent_ } from "./MatrixApi";

export interface Msc3401Call {
	startTime?: number;
	callId: string;
	callEventContent?: CallEventContent_;
	participants?: { [id: string]: boolean };
}
