import { useEffect } from "react";

interface ToastProps {
    title: string;
    body: string;
    durationMs?: number;
    onDismiss: () => void
}

export function Toast({ title, body, durationMs = 10000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

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