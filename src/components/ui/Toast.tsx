"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const toastConfig: Record<Toast["type"], { bg: string; icon: React.ReactNode }> = {
  success: { bg: "bg-success-muted border-success/20", icon: <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> },
  error: { bg: "bg-danger-muted border-danger/20", icon: <AlertCircle className="h-4 w-4 text-danger shrink-0" /> },
  info: { bg: "bg-info-muted border-info/20", icon: <Info className="h-4 w-4 text-info shrink-0" /> },
  warning: { bg: "bg-warning-muted border-warning/20", icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0" /> },
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss]);

  const config = toastConfig[toast.type];

  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 shadow-card text-sm text-zinc-200 flex items-center gap-3 animate-slide-in-right min-w-[300px]",
        config.bg,
      ].join(" ")}
    >
      {config.icon}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast["type"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue: ToastContextValue = {
    success: useCallback((m: string) => addToast("success", m), [addToast]),
    error: useCallback((m: string) => addToast("error", m), [addToast]),
    info: useCallback((m: string) => addToast("info", m), [addToast]),
    warning: useCallback((m: string) => addToast("warning", m), [addToast]),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

export { ToastProvider, useToast };
export type { Toast, ToastContextValue };
