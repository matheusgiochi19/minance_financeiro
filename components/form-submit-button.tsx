"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type FormSubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
};

export function FormSubmitButton({ children, pendingLabel = "Salvando..." }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
