"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type FormSubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
};

export function FormSubmitButton({ children, pendingLabel = "Salvando..." }: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!pending) {
      const timeoutId = window.setTimeout(() => setLocked(false), 250);
      return () => window.clearTimeout(timeoutId);
    }
  }, [pending]);

  return (
    <Button
      type="submit"
      disabled={pending || locked}
      onClick={() => {
        if (!pending) {
          setLocked(true);
        }
      }}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
