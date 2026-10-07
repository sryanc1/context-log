import { useRef } from "react";

export function useBackdropClose(onClose: () => void) {
    const mouseDownOnBackdrop = useRef(false);

    return {
        onMouseDown: (e: React.MouseEvent) => {
            mouseDownOnBackdrop.current = e.target === e.currentTarget;            
        },
        OnClick: (e: React.MouseEvent) => {
            if (mouseDownOnBackdrop.current && e.target === e.currentTarget) {
                onClose();
            }
        },
    };
}