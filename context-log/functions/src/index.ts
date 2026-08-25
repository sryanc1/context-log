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
	console.log(`users id = ${uid}`);
	const tokensSnap = await db.collection('users').doc(uid).collection('fcmToken').get();
	if (tokensSnap.empty) {
		console.log(`No FCM tokens found for uid ${uid} — nothing to send to`);
		return
	};

	const tokens = tokensSnap.docs.map((d) => d.id);
	const response = await messaging.sendEachForMulticast({
		tokens,
		notification: {title, body},		
	});

	console.log(`sendToUser ${uid}: ${response.successCount} succeeded, ${response.failureCount} failed`);
	// Prune tokens FCM reports as permanently dead (app uninstalled, browser data cleared, etc)
	// so this collection doesn't quietly accumulate junk forever.

	const staleTokens: string[] = [];
	response.responses.forEach((res, i) => {
		if (!res.success) {
			console.log(`Token ${tokens[i].slice(0, 12)}... failed: ${res.error?.code}`);
			if (res.error?.code === 'messaging/registration-token-not-registered') {
				staleTokens.push(tokens[i]);
			}
		}
	});
	await Promise.all(
		staleTokens.map((token) => db.collection('users').doc(uid).collection('fcmTokens').doc(token).delete())
	);	
}

export const checkDueDates = onSchedule(
	{ schedule: 'every day 08:00', timeZone: 'Australia/Adelaide'},
	async () => {
		const now = Date.now();

		const [overdueSnap, soonSnap] = await Promise.all([
			db.collectionGroup('items').where('dueDate', '<=', now).get(),
			db.collectionGroup('items').where('dueDate', '<', now).where('dueDate', '<=', now + SOON_THRESHOLD_MS).get(),
		])

		console.log(`checkDueDates: ${overdueSnap.size} overdue candidates, ${soonSnap.size} due-soon candidates`);

		const tasks: Promise<unknown>[] = [];

		for (const doc of overdueSnap.docs) {
			const data = doc.data() as ItemData;
			if (data.notifiedOverdue === true) {
				console.log(`Skipping "${data.title}" — already notified overdue`);
				continue
			};
			const uid = doc.ref.parent.parent?.id;
			if(!uid) continue;
			console.log(`Sending OVERDUE for "${data.title}" to uid ${uid}`);
			tasks.push(sendToUser(uid, 'Overdue', `"${data.title}" is overdue`));
			tasks.push(doc.ref.update({ notifiedOverude: true}));
		}

		for (const doc of soonSnap.docs){
			const data = doc.data() as ItemData;
			if (data.notifiedSoon === true) {
				console.log(`Skipping "${data.title}" — already notified soon`);
				continue
			};
			const uid = doc.ref.parent.parent?.id;
			if (!uid) continue;
			console.log(`Sending SOON for "${data.title}" to uid ${uid}`);
			tasks.push(sendToUser(uid, 'Due soon', `"${data.title}" is due soon.`));
			tasks.push(doc.ref.update({notifiedSoon: true}));			
		}

		await Promise.all(tasks);
		console.log('checkDueDates: done');
	}
)

