"use client";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  message: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function ConfirmSubmitButton({ children, message, variant = "danger" }: ConfirmSubmitButtonProps) {
  return (
    <Button
      size="sm"
      type="submit"
      variant={variant}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
