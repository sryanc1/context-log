// src/services/firebase.ts

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    collectionGroup,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
} from 'firebase/firestore';
import type { Item, ItemStatus, ActivityEntry, ActivityFeedEntry, Project } from '../types/items';
import type { ItemFormValues } from '../components/ItemModal';
import type { ProjectFormValues } from '../components/ProjectModal';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ---- Path helpers — the single source of truth for the nested structure ----

const projectsCollection = (uid: string) => collection(db, 'users', uid, 'projects');
const itemsCollection = (uid: string) => collection(db, 'users', uid, 'items');
const activityCollection = (uid: string, itemId: string) =>
    collection(db, 'users', uid, 'items', itemId, 'activity');
const formatForLog = (key: string, value: unknown) =>
  key === 'dueDate' && typeof value === 'number'
    ? new Date(value).toLocaleDateString()
    : String(value ?? '');

// ---- Allowlist ----

export async function checkAllowlist(email: string): Promise<{allowed: boolean; isAdmin: boolean}> {
    const { getDoc, doc: docRef } = await import('firebase/firestore');
    const snap = await getDoc(docRef(db, 'allowlist', email));
    if(!snap.exists()) return {allowed: false, isAdmin: false};
    const data = snap.data();
    return {allowed: true, isAdmin: data.isAdmin === true};
}

// ---- Projects ----

export function subscribeToProjects(uid: string, callback: (projects: Project[]) => void) {
    return onSnapshot(projectsCollection(uid), (snapshot) => {
        const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
        callback(projects);
    });
}

export async function createProject(
    uid: string,
    values: ProjectFormValues,
    centerX: number,
    centerY: number
) {
    const width = 900;
    const height = 220;
    const now = Date.now();
    const docRef = await addDoc(projectsCollection(uid), {
        title: values.title,
        description: values.description,
        color: values.color,
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        archived: false, archivedAt: null,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}

export async function updateProject(uid: string, projectId: string, values: ProjectFormValues) {
    const projectRef = doc(db, 'users', uid, 'projects', projectId);
    await updateDoc(projectRef, {
        title: values.title,
        description: values.description,
        color: values.color,
        updatedAt: Date.now(),
    });
}

export async function updateProjectPosition(uid: string, projectId: string, x: number, y: number) {
    const projectRef = doc(db, 'users', uid, 'projects', projectId);
    await updateDoc(projectRef, { x, y, updatedAt: Date.now() });
}

export async function updateProjectSize(uid: string, projectId: string, height: number) {
    const projectRef = doc(db, 'users', uid, 'projects', projectId);
    await updateDoc(projectRef, { height, updatedAt: Date.now() });
}

export async function archiveProject(uid: string, projectId: string, archived: boolean) {
    const projectRef = doc(db, 'users', uid, 'projects', projectId);
    await updateDoc(projectRef, { 
        archived, 
        archivedAt: archived ? Date.now() : null,
        updatedAt: Date.now() });
}

// ---- Items ----

export function subscribeToItems(uid: string, callback: (items: Item[]) => void) {
    const q = query(itemsCollection(uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
        callback(items);
    });
}

export async function createItem(uid: string, item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now();
    const docRef = await addDoc(itemsCollection(uid), {
        ...item,
        createdAt: now,
        updatedAt: now,
    });
    await logActivity(uid, docRef.id, {
        action: 'create',
        description: `Created "${item.title}"`,
    });
    return docRef.id;
}

export async function updateItemStatus(
    uid: string,
    itemId: string,
    oldStatus: ItemStatus,
    newStatus: ItemStatus
) {
    const itemRef = doc(db, 'users', uid, 'items', itemId);
    await updateDoc(itemRef, { status: newStatus, updatedAt: Date.now() });
    await logActivity(uid, itemId, {
        action: 'status_changed',
        description: `Status changed from "${oldStatus}" to "${newStatus}"`,
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
    });
}

export async function updateItemPosition(
    uid: string,
    itemId: string,
    x: number,
    y: number,
    newContainerId: string | null,
    oldContainerId: string | null
) {
    const itemRef = doc(db, 'users', uid, 'items', itemId);
    await updateDoc(itemRef, { x, y, containerId: newContainerId, updatedAt: Date.now() });

    if (newContainerId !== oldContainerId) {
        await logActivity(uid, itemId, {
        action: 'moved',
        description: `Moved to a different project`,
        fieldChanged: 'containerId',
        oldValue: oldContainerId ?? 'unassigned',
        newValue: newContainerId ?? 'unassigned',
        });
    }
}

export async function updateItem(
    uid: string,
    itemId: string,
    oldItem: Item,
    values: ItemFormValues & { x: number; y: number }
) {
    const itemRef = doc(db, 'users', uid, 'items', itemId);
    const updates: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        status: values.status,
        tags: values.tags,
        x: values.x,
        y: values.y,
        updatedAt: Date.now(),
        dueDate: values.dueDate,
    };
    if (values.type === 'decision') {
        updates.reason = values.reason ?? '';
        updates.impact = values.impact ?? '';
    }
    await updateDoc(itemRef, updates);

    const fields: Array<{ key: keyof Item; label: string; action: ActivityEntry['action'] }> = [
        { key: 'title', label: 'Title', action: 'field_updated' },
        { key: 'description', label: 'Description', action: 'field_updated' },
        { key: 'type', label: 'Type', action: 'field_updated' },
        { key: 'priority', label: 'Priority', action: 'field_updated' },
        { key: 'status', label: 'Status', action: 'status_changed' },
        { key: 'dueDate', label: 'Due Date', action: 'field_updated'},
    ];
    for (const { key, label, action } of fields) {
        const oldValue = formatForLog(key, oldItem[key]);
        const newValue = formatForLog(key, updates[key as string]);
        if (oldValue !== newValue) {
        await logActivity(uid, itemId, {
            action,
            description: `${label} changed from "${oldValue}" to "${newValue}"`,
            fieldChanged: key,
            oldValue,
            newValue,
        });
        }
    }

    const oldTags = oldItem.tags.join(', ');
    const newTags = values.tags.join(', ');
    if (oldTags !== newTags) {
        await logActivity(uid, itemId, {
        action: 'field_updated',
        description: 'Tags changed',
        fieldChanged: 'tags',
        oldValue: oldTags || '(none)',
        newValue: newTags || '(none)',
        });
    }
}

export async function deleteItem(uid: string, itemId: string) {
    await deleteDoc(doc(db, 'users', uid, 'items', itemId));
}

// ---- Activity (auto-logged, subcollection per item) ----

async function logActivity(
    uid: string,
    itemId: string,
    entry: Omit<ActivityEntry, 'id' | 'createdAt'>
) {
    await addDoc(activityCollection(uid, itemId), {
        ...entry,
        createdAt: Date.now(),
    });
}

export function subscribeToRecentActivity(uid: string, callback: (entries: ActivityFeedEntry []) => void ) {
    const q = query(collectionGroup(db, 'activity'), orderBy('createdAt', 'desc'), limit(200));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs
            .filter((d) => d.ref.path.startsWith(`user/${uid}/`))
            .map((d) => {
                const itemId = d.ref.parent.parent?.id ?? '';
                return { id: d.id, itemId, ...d.data()} as ActivityFeedEntry;
            });
        callback(entries)
    });
}