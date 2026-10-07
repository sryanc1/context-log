// src/components/ItemModal.tsx

import { useEffect, useRef, useState } from 'react';
import type { Item, ItemStatus, ItemType, Priority } from '../types/items';
import { getDueUrgency } from '../utils/dueDate';
import { useBackdropClose} from '../hooks/useBackdropClose'

export interface ItemFormValues {
	title: string;
	description: string;
	type: ItemType;
	priority: Priority;
	status: ItemStatus;
	tags: string[];
	dueDate: number | null;
	reason?: string;
	impact?: string;
}

interface ItemModalProps {
	mode: 'create' | 'edit';
	initialItem?: Item;
	defaultStatus?: ItemStatus;
	onSave: (values: ItemFormValues) => void;
	onCancel: () => void;
	onRemove?: () => void;
}

const ITEM_TYPES: ItemType[] = ['task', 'issue', 'decision', 'note', 'document', 'meeting', 'contact', 'asset'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUSES: ItemStatus[] = ['backlog', 'active', 'waiting', 'completed'];

// Single source of truth for "what should the form contain right now" —
// used both to initialize state and to reset it when an edit is discarded.
function getFormValuesFromItem(item?: Item, defaultStatus?: ItemStatus) {
	return {
		title: item?.title ?? '',
		description: item?.description ?? '',
		type: (item?.type ?? 'task') as ItemType,
		priority: (item?.priority ?? 'medium') as Priority,
		status: item?.status ?? defaultStatus ?? 'backlog',
		tagsInput: item?.tags.join(', ') ?? '',
		dueDateInput: item?.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
		reason: item?.type === 'decision' ? item.reason : '',
		impact: item?.type === 'decision' ? item.impact : '',
	};
}

export function ItemModal({ mode, initialItem, defaultStatus, onSave, onCancel, onRemove }: ItemModalProps) {
	const initialValues = getFormValuesFromItem(initialItem, defaultStatus);

	const [isEditing, setIsEditing] = useState(mode === 'create');
	const [title, setTitle] = useState(initialValues.title);
	const [description, setDescription] = useState(initialValues.description);
	const [type, setType] = useState<ItemType>(initialValues.type);
	const [priority, setPriority] = useState<Priority>(initialValues.priority);
	const [status, setStatus] = useState<ItemStatus>(initialValues.status);
	const [tagsInput, setTagsInput] = useState(initialValues.tagsInput);
	const [dueDateInput, setDueDateInput] = useState(initialValues.dueDateInput);
	const [reason, setReason] = useState(initialValues.reason);
	const [impact, setImpact] = useState(initialValues.impact);

	const descriptionRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (isEditing && descriptionRef.current) {
		const el = descriptionRef.current;
		el.focus();
		el.setSelectionRange(el.value.length, el.value.length);
		}
	}, [isEditing]);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onCancel();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onCancel]);

	const canSave = title.trim().length > 0;

	const handleSave = () => {
		if (!canSave) return;
		const values: ItemFormValues = {
			title: title.trim(),
			description,
			type,
			priority,
			status,
			tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
			dueDate: dueDateInput ? new Date(dueDateInput).getTime() : null,
		};
		if (type === 'decision') {
			values.reason = reason;
			values.impact = impact;
		}
		onSave(values);
	};

	const handleRemove = () => {
		const confirmed = window.confirm(`Permanently delete "${initialItem?.title}"? This cannot be undone.`);
		if (confirmed) onRemove?.();
	};

	const handleEditCancel = () => {
		if (mode === 'create') {
			onCancel();
			return;
		}
		const reset = getFormValuesFromItem(initialItem, defaultStatus);
		setTitle(reset.title);
		setDescription(reset.description);
		setType(reset.type);
		setPriority(reset.priority);
		setStatus(reset.status);
		setTagsInput(reset.tagsInput);
		setDueDateInput(reset.dueDateInput);
		setReason(reset.reason);
		setImpact(reset.impact);
		setIsEditing(false);
	};

	const backdropHandlers = useBackdropClose(onCancel);

	// ---- View mode — only reachable when editing an existing item ----
	if (!isEditing && initialItem) {
		const urgency = getDueUrgency(initialItem.dueDate);
		return (
		<div className="modal-backdrop" {...backdropHandlers}>
			<div className="modal-card" onClick={(e) => e.stopPropagation()}>
				<div className="modal-card-scroll">
					<button className="modal-close-handle" onClick={onCancel} aria-label="Close">✕</button>
					<h2 className="view-title">{initialItem.title}</h2>

					<div className="view-chip-row">
						<span className="view-chip">{initialItem.type}</span>
						<span className="view-chip">{initialItem.priority} priority</span>
						<span className="view-chip">{initialItem.status}</span>
						{initialItem.dueDate && (
							<span className={`view-chip ${urgency ? `view-chip-${urgency}` : ''}`}>
								Due {new Date(initialItem.dueDate).toLocaleDateString()}
							</span>
						)}
					</div>

					<div className="view-timestamps">
						Created {new Date(initialItem.createdAt).toLocaleDateString()} · Updated {new Date(initialItem.createdAt).toLocaleDateString()}
					</div>

					{initialItem.tags.length > 0 && (
						<div className="view-tag-row">
							{initialItem.tags.map((tag) => <span key={tag} className="view-tag">{tag}</span>)}
						</div>
					)}

					<div className="view-body">
						<p className="view-description">{initialItem.description || 'No description yet.'}</p>

						{initialItem.type === 'decision' && (
							<>
								<div className="view-section-label">Reason</div>
								<p className="view-description">{initialItem.reason || '—'}</p>
								<div className="view-section-label">Impact</div>
								<p className="view-description">{initialItem.impact || '—'}</p>
							</>
						)}
					</div>

					<div className="modal-footer">
						{onRemove && (
							<button className="modal-button modal-button-danger" onClick={handleRemove}>Remove</button>
						)}
						<div className="modal-footer-right">
							<button className="modal-button modal-button-primary" onClick={() => setIsEditing(true)}>Edit</button>
						</div>
					</div>
				</div>		
			</div>
		</div>
		);
	}

	// ---- Edit / create form mode ----
	return (
		<div className="modal-backdrop" {...backdropHandlers}>
			<div className="modal-card" onClick={(e) => e.stopPropagation()}>
				<div className="modal-card-scroll">
					<button className="modal-close-handle" onClick={handleEditCancel} aria-label="Close">✕</button>
					<h2 className="modal-title">{mode === 'create' ? 'New item' : 'Edit item'}</h2>

					<label className="modal-label">
						Title
						<input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={mode === 'create'} />
					</label>

					<div className="modal-row">
						<label className="modal-label">
							Type
							<select className="modal-input" value={type} onChange={(e) => setType(e.target.value as ItemType)}>
							{ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
							</select>
						</label>
						<label className="modal-label">
							Priority
							<select className="modal-input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
							{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
							</select>
						</label>
						<label className="modal-label">
							Status
							<select className="modal-input" value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
							{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
							</select>
						</label>
					</div>

					<div className="modal-row">
						<label className="modal-label">
							Tags <span className="modal-hint">comma separated</span>
							<input className="modal-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
						</label>
						<label className="modal-label">
							Due date <span className="modal-hint">optional</span>
							<input type="date" className="modal-input" value={dueDateInput} onChange={(e) => setDueDateInput(e.target.value)} />
						</label>
					</div>

					<label className="modal-label">
						Description
						<textarea
							ref={descriptionRef}
							className="modal-input modal-textarea modal-textarea-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
					</label>

					{type === 'decision' && (
						<>
							<label className="modal-label">
								Reason
								<textarea className="modal-input modal-textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
							</label>
							<label className="modal-label">
								Impact
								<textarea className="modal-input modal-textarea" value={impact} onChange={(e) => setImpact(e.target.value)} />
							</label>
						</>
					)}

					{mode === 'edit' && onRemove ? (
						<div className='modal-footer'>
							<button className="modal-button modal-button-danger" onClick={handleRemove}>Remove</button>
							<div className='modal-footer-right'>
								<button className="modal-button modal-button-ghost" onClick={handleEditCancel}>Cancel</button>
								<button className="modal-button modal-button-primary" onClick={handleSave} disabled={!canSave}>Save</button>
							</div>
						</div>
						
					) : (
						<div className="modal-footer-right">
							<button className="modal-button modal-button-ghost" onClick={handleEditCancel}>Cancel</button>
							<button className="modal-button modal-button-primary" onClick={handleSave} disabled={!canSave}>Save</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}