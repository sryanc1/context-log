// src/components/AdminView.tsx

import { useState } from "react";
import type { AllowlistEntry } from "../types/items";
import { formatRelativeTime } from "../utils/time";

interface AdminViewProps {
    entries: AllowlistEntry[];
    currentUserEmail: string;
    onAdd: (email: string, notes: string, isAdmin: boolean) => void;
    onRemove: (email: string) => void;
    onTggleAdmin: (email: string, isAdmin: boolean) => void;
}

export function AdminView({ entries, currentUserEmail, onAdd, onRemove, onTggleAdmin }: AdminViewProps) {
    const [email, setEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [grantAdmin, setGrantAdmin] = useState(false);

    const handleAdd = () => {
        if (!email.trim()) return;
        onAdd(email, notes, grantAdmin);
        setEmail('');
        setNotes('');
        setGrantAdmin(false);
    };

    const handleRemove = (entryEmail: string) => {
        const confirmed = window.confirm(`Remove ${entryEmail}'s access? They'll lose access on their next request.`);
        if (confirmed) onRemove(entryEmail);
    };

    return (
        <div className="admin-view">
            <div className="admin-add-row">
                <input
                className="modal-input"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
                <input
                className="modal-input"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                />
                <label className="admin-checkbox-label">
                <input type="checkbox" checked={grantAdmin} onChange={(e) => setGrantAdmin(e.target.checked)} />
                Admin
                </label>
                <button className="modal-button modal-button-primary" onClick={handleAdd}>Add</button>
            </div>

            <div className="archive-list">
                {entries.map((entry) => {
                    const isSelf = entry.email === currentUserEmail.toLowerCase();
                    return (
                        <div key={entry.email} className="archive-row">
                            <div className="archive-row-header">
                                <div className="archive-info">
                                    <div className="archive-title">
                                        {entry.email}
                                    </div>
                                    <div className="archive-meta">
                                        Added {formatRelativeTime(entry.addedAt)} · {entry.source}
                                        {entry.notes ? ` · ${entry.notes}` : ''}
                                    </div>
                                </div>
                                <label className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={entry.isAdmin}
                                        disabled={isSelf}
                                        onChange={(e) => onTggleAdmin(entry.email, e.target.checked)}
                                    />
                                    Admin
                                </label>
                                <button
                                    className="modal-button modal-button-danger"
                                    disabled={isSelf}
                                    onClick={() => handleRemove(entry.email)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}