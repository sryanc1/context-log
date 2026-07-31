import { useEffect } from "react";

interface ToastProps {
    title: string;
    body: string;
    onDismiss: () => void
}

export function Toast({title, body, onDismiss}: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 6000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="toast" onClick={onDismiss}>
            <div className="toast-title">
                {title}
            </div>
            <div className="toast-body">
                {body}
            </div>
        </div>
    )
}