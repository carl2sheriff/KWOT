"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setResolveRef({ resolve });
    });
  }, []);

  const handleClose = useCallback(() => {
    resolveRef?.resolve(false);
    setOptions(null);
    setResolveRef(null);
  }, [resolveRef]);

  const handleConfirm = useCallback(() => {
    resolveRef?.resolve(true);
    setOptions(null);
    setResolveRef(null);
  }, [resolveRef]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal isOpen={!!options} onClose={handleClose} size="sm" showClose={false}>
        {options && (
          <div className="-mx-6 -mt-6">
            <div className="px-6 pt-6 pb-6">
              {options.danger && (
                <div className="w-10 h-10 rounded-lg bg-danger-muted flex items-center justify-center mb-4">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                </div>
              )}
              <h3 className="text-base font-semibold text-zinc-100 mb-2">
                {options.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                {options.message}
              </p>
              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" size="sm" onClick={handleClose}>
                  {options.cancelLabel || "Annuler"}
                </Button>
                <Button
                  variant={options.danger ? "danger" : "accent"}
                  size="sm"
                  onClick={handleConfirm}
                >
                  {options.confirmLabel || "Confirmer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
}

export { ConfirmProvider, useConfirm };
export type { ConfirmOptions, ConfirmContextValue };
