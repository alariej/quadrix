export interface ReadReceipt {
	[userId: string]: { eventId: string; timestamp: number };
}
