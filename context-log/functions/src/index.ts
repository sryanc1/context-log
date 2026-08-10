import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/scheduler";
import * as admin from 'firebase-admin'

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const healthCheck = onRequest((req, res) => {
	res.send('context-log functions: alive');
});

const SOON_THRESHOLD_MS = 24*60*60*1000;

interface ItemData {
	title: string;
	dueDate: number | null;
	notifiedSoon?: boolean;
	notifiedOverdue?: boolean;
}

async function sendToUser(uid: string, title: string, body: string) {
	const tokensSnap = await db.collection('users').doc(uid).collection('fmcToken').get();
	if (tokensSnap.empty) return;

	const tokens = tokensSnap.docs.map((d) => d.id);
	const response = await messaging.sendEachForMulticast({
		tokens,
		notification: {title, body},		
	});

	// Prune tokens 
}

