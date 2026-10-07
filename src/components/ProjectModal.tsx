// src/components/ProjectModal.tsx

import { useEffect, useState } from "react";
import type { Project } from "../types/items";
import { projectColors } from "../theme";
import { getReadableTextColour } from "../utils/contrast";
import { useBackdropClose } from "../hooks/useBackdropClose";

export interface ProjectFormValues {
    title: string;
    description: string;
    color: string;
}

interface ProjectModalProps {
    mode: 'create' | 'edit'
    initialProject?: Project;
    onSave: (values: ProjectFormValues) => void;
    onCancel: () => void;
}

export function ProjectModal({ mode, initialProject, onSave, onCancel}: ProjectModalProps) {
    const [title, setTitle] = useState(initialProject?.title ?? '');
    const [description, setDescription] = useState(initialProject?.description ?? '');
    const [color, setColor] = useState(initialProject?.color ?? projectColors[0].hex);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onCancel]);

    const canSave = title.trim().length > 0

    const handleSave = () => {
        if (!canSave) return 
        onSave({title: title.trim(), description, color});
    };

    const backdropHandlers = useBackdropClose(onCancel);

    return (
        <div className="modal-backdrop" {...backdropHandlers}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-handle" onClick={onCancel} aria-label="Close">✕</button>
                <div className="modal-card-scroll">
                    
                     <h2 className="modal-title">{mode === 'create' ? 'New project' : 'Edit project'}</h2>                
                    <div className="modal-header-preview" style={{background: color, color: getReadableTextColour(color)}}>
                        {(title || 'Project title').toUpperCase()}
                    </div>

                    <label className="modal-label">
                        Title
                        <input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus/>
                    </label>

                    <label className="modal-label">
                        Description
                        <textarea className="modal-input modal-textarea" value={description} onChange={(e) => setDescription(e.target.value)}/>                                            
                    </label>

                    <div className="modal-label">
                        Color
                        <div className="modal-swatch-row">
                            {projectColors.map((c) => (
                                <button 
                                    key={c.hex}
                                    type="button"
                                    aria-label={c.name}
                                    title={c.name}
                                    className={`modal-swatch ${color === c.hex ? 'modal-swatch-selected' : ''}`}
                                    style={{background: c.hex}}
                                    onClick={()=>setColor(c.hex)}
                                />
                            ))}                    
                        </div>
                    </div>

                    <div className="modal-footer"></div>
                    <div className="modal-footer-right">
                        <button className="modal-button modal-button-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="modal-button modal-button-ghost" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </div>               
            </div>
        </div>
    );
}