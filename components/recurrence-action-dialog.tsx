"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type RecurrenceActionDialogProps = {
  allLabel: string;
  cancelHref?: string;
  cancelLabel?: string;
  defaultOpen?: boolean;
  description: string;
  formId: string;
  inline?: boolean;
  singleLabel: string;
  title: string;
  triggerLabel?: string;
  variant?: "edit" | "delete";
};

export function RecurrenceActionDialog({
  allLabel,
  cancelHref,
  cancelLabel = "Cancelar",
  defaultOpen = false,
  description,
  formId,
  inline = false,
  singleLabel,
  title,
  triggerLabel,
  variant = "edit"
}: RecurrenceActionDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const singleVariant = variant === "delete" ? "danger" : "primary";
  const allVariant = variant === "delete" ? "secondary" : "secondary";

  if (!open) {
    return (
      <Button size="sm" type="button" variant={variant === "delete" ? "secondary" : "secondary"} onClick={() => setOpen(true)}>
        {triggerLabel || (variant === "delete" ? "Excluir recorrente" : "Editar recorrente")}
      </Button>
    );
  }

  return (
    <div className={`recurrence-dialog ${inline ? "recurrence-dialog-inline" : ""}`} role={inline ? undefined : "dialog"} aria-modal={inline ? undefined : "true"}>
      <div className="recurrence-dialog-panel">
        <p className="eyebrow">Lançamento recorrente</p>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="recurrence-dialog-actions">
          <Button form={formId} name="scope" type="submit" value="single" variant={singleVariant}>
            {singleLabel}
          </Button>
          <Button form={formId} name="scope" type="submit" value="all" variant={allVariant}>
            {allLabel}
          </Button>
          {cancelHref ? (
            <Link className="secondary-link-button" href={cancelHref}>
              {cancelLabel}
            </Link>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecurrenceBadge() {
  return <span className="recurrence-badge">↻ Recorrente</span>;
}
