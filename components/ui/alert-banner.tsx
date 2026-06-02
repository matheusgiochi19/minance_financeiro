"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { uiAlertLabels, type UiAlertType } from "@/lib/ui-alert";

type AlertBannerProps = {
  className?: string;
  message: string;
  onDismiss?: () => void;
  type: UiAlertType;
};

export function AlertBanner({ className, message, onDismiss, type }: AlertBannerProps) {
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;
    const timeoutId = window.setTimeout(() => {
      dismiss();
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
      <strong>{uiAlertLabels[type]}</strong>
      <p>{message}</p>
      <button
        aria-label="Fechar mensagem"
        className="alert-banner-close"
        onClick={() => {
          dismiss();
        }}
        type="button"
      >
        <X aria-hidden size={18} />
      </button>
    </div>
  );
}
