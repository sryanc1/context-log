// src/components/ItemModal.tsx

import { useEffect, useState } from 'react';
import type { Item, ItemStatus, AnyItemType, Priority } from '../types/items';

export interface ItemFormValues {
  title: string;
  description: string;
  type: AnyItemType;
  priority: Priority;
  status: ItemStatus;
  tags: string[];
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

const ITEM_TYPES: AnyItemType[] = ['task', 'issue', 'decision', 'note', 'document', 'meeting', 'contact', 'asset'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUSES: ItemStatus[] = ['backlog', 'active', 'waiting', 'completed'];

export function ItemModal({ mode, initialItem, defaultStatus, onSave, onCancel, onRemove }: ItemModalProps) {
  const [title, setTitle] = useState(initialItem?.title ?? '');
  const [description, setDescription] = useState(initialItem?.description ?? '');
  const [type, setType] = useState<AnyItemType>(initialItem?.type ?? 'task');
  const [priority, setPriority] = useState<Priority>(initialItem?.priority ?? 'medium');
  const [status, setStatus] = useState<ItemStatus>(initialItem?.status ?? defaultStatus ?? 'backlog');
  const [tagsInput, setTagsInput] = useState(initialItem?.tags.join(', ') ?? '');
  const [reason, setReason] = useState(initialItem?.type === 'decision' ? initialItem.reason : '');
  const [impact, setImpact] = useState(initialItem?.type === 'decision' ? initialItem.impact : '');

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

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{mode === 'create' ? 'New item' : 'Edit item'}</h2>

        <label className="modal-label">
          Title
          <input
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
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

        <label className="modal-label">
          Tags <span className="modal-hint">comma separated</span>
          <input className="modal-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
        </label>

        <label className="modal-label">
          Description
          <textarea
            className="modal-input modal-textarea"
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

        <div className="modal-footer">
          {mode === 'edit' && onRemove && (
            <button className="modal-button modal-button-danger" onClick={handleRemove}>
              Remove
            </button>
          )}
          <div className="modal-footer-right">
            <button className="modal-button modal-button-ghost" onClick={onCancel}>Cancel</button>
            <button className="modal-button modal-button-primary" onClick={handleSave} disabled={!canSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}