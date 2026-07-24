import {initializeApp} from "firebase/app";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc
} from "firebase/firestore";
import type { Item, ItemStatus, ActivityEntry, Project } from "../types/items";
import type { ItemFormValues } from "../components/ItemModal";
import type { ProjectFormValues } from '../components/ProjectModal';

// Populate these from Firebase project setting, same pattern as my other apps
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- Items ---
const itemsCollection = collection(db, "items");

export function subscribeToItems(callback: (items: Item[]) => void) {
    const q = query(itemsCollection, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
        callback(items);
    });
}

export async function createItem(item: Omit<Item, "id" | "createdAt" | "updatedAt">){
    const now = Date.now();
    const docRef = await addDoc(itemsCollection, {
        ...item,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}

export async function updateItemStatus(itemId: string, oldStatus: ItemStatus, newStatus: ItemStatus) {
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, {
        status: newStatus,
        updatedAt: Date.now(),
    });
    await logActivity(itemId, {
        action: 'status_changed',
        description: `Status changed from ${oldStatus} to ${newStatus}`,
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
    });
}

// ---- Item position (card drag) ----

export async function updateItemPosition(
    itemId: string,
    x: number,
    y: number,
    newContainerId: string | null,
    oldContainerId: string | null
){
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, { x, y, containerId: newContainerId, updatedAt: Date.now() });

    if (newContainerId !== oldContainerId) {
        await logActivity(itemId, {
            action: 'moved',
            description: `Moved to a different project`,
            fieldChanged: 'containerId',
            oldValue: oldContainerId ?? 'unassigned',
            newValue: newContainerId ?? 'unassigned',
        });
    }
}

export async function updateItem(itemId: string, oldItem: Item, values: ItemFormValues & {x: number; y: number})
{
    const itemRef = doc(db, 'items', itemId)
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
    };
    if (values.type === 'decision') {
        updates.reason = values.reason ?? '';
        updates.impact = values.impact ?? '';
    }
    await updateDoc(itemRef, updates);

    // One Activity per changed field. x/y excluded -
    // position is a side-effect of the status change covered below.
    const fields: Array<{key: keyof Item; label: string; action: ActivityEntry['action']}> = [
        {key: 'title', label: 'Title', action: 'field_updated'},
        { key: 'description', label: 'Description', action: 'field_updated' },
        { key: 'type', label: 'Type', action: 'field_updated' },
        { key: 'priority', label: 'Priority', action: 'field_updated' },
        { key: 'status', label: 'Status', action: 'status_changed' },
    ];
    for (const {key, label, action} of fields) {
        const oldValue = String(oldItem[key] ?? '');
        const newValue = String(updates[key as string] ?? '');
        if (oldValue !== newValue) {
            await logActivity(itemId, {
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
        await logActivity(itemId, {
        action: 'field_updated',
        description: 'Tags changed',
        fieldChanged: 'tags',
        oldValue: oldTags || '(none)',
        newValue: newTags || '(none)',
        });
    }    
}

// --- Activity (auto-logged, subcollection per item) ---

async function logActivity(
    itemId: string,
    entry: Omit<ActivityEntry, "id" | "createdAt">
) {
    const activityCollection = collection(db, 'items', itemId, 'activity');
    await addDoc(activityCollection, {
        ...entry,
        createdAt: Date.now(),
    })
}

// --- Projects ---
const projectsCollection = collection(db, 'projects');

export function subscribeToProjects(callback: (projects: Project[]) => void) {
    return onSnapshot(projectsCollection, (snapshot) => {
        const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
        callback(projects);
    });
}

export async function createProject(values: ProjectFormValues, centerX: number, centerY: number) {
    const width = 480;
    const height = 220;
    const now = Date.now();
    const docRef = await addDoc(projectsCollection, {
        title: values.title,
        description: values.description,
        color: values.color,
        x: centerX - width/2, 
        y: centerY - height/2,
        width,
        height,
        archived: false,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}

export async function updateProject(projectId: string, values: ProjectFormValues) {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
        title: values.title,
        description: values.description,
        color: values.color,
        updatedAt: Date.now(),
    });
}

export async function updateProjectPosition(projectId: string, x: number, y: number) {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { x, y, updatedAt: Date.now() });
    // Deliberately no activity log here — see note below
}

export async function archiveProject(projectId: string, archived: boolean) {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { archived, updatedAt: Date.now() });
}

export async function deleteItem(itemId: string) {
    await deleteDoc(doc(db, 'items', itemId));
}

