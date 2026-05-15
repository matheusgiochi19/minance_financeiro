"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { FlashType } from "@/lib/flash";

type AlertBannerProps = {
  className?: string;
  clearOnMount?: boolean;
  message: string;
  onDismiss?: () => void;
  persisted?: boolean;
  type: FlashType;
};

export function AlertBanner({ className, clearOnMount = false, message, onDismiss, persisted = false, type }: AlertBannerProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(async () => {
    setVisible(false);
    onDismiss?.();
    if (!persisted) return;
    await fetch("/api/flash", { method: "DELETE" }).catch(() => undefined);
  }, [onDismiss, persisted]);

  useEffect(() => {
    if (!persisted || !clearOnMount) return;
    void fetch("/api/flash", { method: "DELETE" }).catch(() => undefined);
  }, [clearOnMount, persisted]);

  useEffect(() => {
    if (!visible) return;
    const timeoutId = window.setTimeout(() => {
      void dismiss();
    }, 10_000);

    return () => window.clearTimeout(timeoutId);
  }, [dismiss, visible]);

  if (!message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn("alert-banner", `alert-banner-${type}`, !visible && "is-hidden", className)}
      role={type === "error" ? "alert" : "status"}
    >
      <p>{message}</p>
      <button
        aria-label="Fechar mensagem"
        className="alert-banner-close"
        onClick={() => {
          void dismiss();
        }}
        type="button"
      >
        <X aria-hidden size={18} />
      </button>
    </div>
  );
}
