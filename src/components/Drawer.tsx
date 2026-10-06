// src/components/Drawer.tsx

import type { ReactNode } from "react";

interface DrawerProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export function Drawer({isOpen, title, onClose, children} : DrawerProps) {
    return (
        <div className={`drawer ${isOpen ? 'drawer-open' : ''}`} aria-hidden={!isOpen}>
            <div className="drawer-header">
                <h2 className="drawer-title">{title}</h2>
            </div>
            <div className="drawer-body">{children}</div>
            <button className="drawer-close-handle" onClick={onClose} aria-label="Cloase">
                X
            </button>
        </div>
    );
}