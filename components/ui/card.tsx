import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLElement> & {
  tone?: "default" | "muted" | "income" | "expense" | "cards";
};

export function Card({ children, className, tone = "default", ...props }: CardProps) {
  return (
    <article className={cn("ui-card", `ui-card-${tone}`, className)} {...props}>
      {children}
    </article>
  );
}
