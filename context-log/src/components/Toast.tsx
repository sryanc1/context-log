import { useEffect } from "react";

interface ToastProps {
    title: string;
    body: string;
    onDismiss: () => void
}