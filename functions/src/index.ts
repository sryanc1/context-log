import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
//import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
//import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// const smtpHost = defineSecret('SMTP_HOST');
// const smtpUser = defineSecret('SMTP_USER');
// const smtpPass = defineSecret('SMTP_PASS');
// const smtpFrom = defineSecret('SMTP_FROM');

export const healthCheck = onRequest((req, res) => {
 	res.send('context-log functions: alive');
});

const SOON_THRESHOLD_MS = 24 * 60 * 60 * 1000;

interface ItemData {
	title: string;
	status?: string;
	dueDate: number | null;
	notifiedSoon?: boolean;
	notifiedOverdue?: boolean;
}

interface CachedSettings { hour: number; timezone: string; }

const settingsCache = new Map<string, CachedSettings>();

async function getUserSettings(uid: string): Promise<CachedSettings> {
	if (settingsCache.has(uid)) return settingsCache.get(uid)!;
	const snap = await db.collection('users').doc(uid).get();
	const settings: CachedSettings = {
		hour: snap.data()?.notificationHour ?? 8,
		timezone: snap.data()?.timezone ?? 'Australia/Adelaide',
	};
	settingsCache.set(uid, settings);
	return settings;
}

function getCurrentHourInTimezone(timezone: string): number {
	try {
		const formatter = new Intl.DateTimeFormat('en-AU', { timeZone: timezone, hour: 'numeric', hour12: false });
		return parseInt(formatter.format(new Date()), 10) % 24;
	} catch {
		// Malformed/unrecognized timezone string — fall back rather than crash the whole run
		console.log(`Invalid timezone "${timezone}", falling back to Australia/Adelaide`);
		const formatter = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Adelaide', hour: 'numeric', hour12: false });
		return parseInt(formatter.format(new Date()), 10) % 24;
	}
}

async function sendPushToUser(uid: string, title: string, body: string) {
	const tokensSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
	if (tokensSnap.empty) {
		console.log(`No FCM tokens found for uid ${uid} — nothing to push`);
		return;
	}

	const tokens = tokensSnap.docs.map((d) => d.id);
	const response = await messaging.sendEachForMulticast({ tokens, notification: { title, body } });
	console.log(`Push to ${uid}: ${response.successCount} succeeded, ${response.failureCount} failed`);

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

// async function sendEmailToUser(uid: string, subject: string, body: string) {
//   let email: string | undefined;
//   try {
//     const userRecord = await admin.auth().getUser(uid);
//     email = userRecord.email;
//   } catch (err) {
//     console.log(`Could not look up auth user ${uid}: ${err}`);
//     return;
//   }
//   if (!email) {
//     console.log(`No email on record for uid ${uid}`);
//     return;
//   }

//   const transporter = nodemailer.createTransport({
//     host: smtpHost.value(),
//     port: 587,
//     secure: false,
//     auth: { user: smtpUser.value(), pass: smtpPass.value() },
//   });

//   try {
//     await transporter.sendMail({
//       from: smtpFrom.value(),
//       to: email,
//       subject: `context-log: ${subject}`,
//       text: body,
//     });
//     console.log(`Email sent to ${email}`);
//   } catch (err) {
//     console.log(`Email send failed for ${email}: ${err}`);
//   }
// }

export const checkDueDates = onSchedule(
	{
		schedule: 'every 1 hours',
		timeZone: 'Australia/Adelaide',
		//secrets: [smtpHost, smtpUser, smtpPass, smtpFrom],
	},
	async () => {
		settingsCache.clear();
		const now = Date.now();

		const [overdueSnap, soonSnap] = await Promise.all([
			db.collectionGroup('items').where('dueDate', '<=', now).get(),
			db.collectionGroup('items').where('dueDate', '>', now).where('dueDate', '<=', now + SOON_THRESHOLD_MS).get(),
		]);

		const tasks: Promise<unknown>[] = [];

		for (const doc of overdueSnap.docs) {
			const data = doc.data() as ItemData;
			if (data.status === 'completed') continue;
			if (data.notifiedOverdue === true) continue;
			const uid = doc.ref.parent.parent?.id;
			if (!uid) continue;

			const { hour: preferredHour, timezone } = await getUserSettings(uid);
			if (preferredHour !== getCurrentHourInTimezone(timezone)) continue;

			console.log(`Sending OVERDUE for "${data.title}" to uid ${uid}`);
			tasks.push(sendPushToUser(uid, 'Overdue', `"${data.title}" is overdue.`));
			//tasks.push(sendEmailToUser(uid, 'Overdue', `"${data.title}" is overdue.`));
			tasks.push(doc.ref.update({ notifiedOverdue: true }));
		}

		for (const doc of soonSnap.docs) {
			const data = doc.data() as ItemData;
			if (data.status === 'completed') continue;
			if (data.notifiedSoon === true) continue;
			const uid = doc.ref.parent.parent?.id;
			if (!uid) continue;

			const { hour: preferredHour, timezone } = await getUserSettings(uid);
			if (preferredHour !== getCurrentHourInTimezone(timezone)) continue;

			console.log(`Sending SOON for "${data.title}" to uid ${uid}`);
			tasks.push(sendPushToUser(uid, 'Due soon', `"${data.title}" is due soon.`));
			//tasks.push(sendEmailToUser(uid, 'Due soon', `"${data.title}" is due soon.`));
			tasks.push(doc.ref.update({ notifiedSoon: true }));
		}

		await Promise.all(tasks);
		console.log('checkDueDates: done');
	}
);