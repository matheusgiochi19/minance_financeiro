"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AlertBanner } from "@/components/ui/alert-banner";
import type { UiAlertType } from "@/lib/ui-alert";

export function UrlAlertBanner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("alert") || "";
  const type = (searchParams.get("alertType") || "success") as UiAlertType;

  const cleanUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("alert");
    params.delete("alertType");
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
  }, [pathname, searchParams]);

  if (!message || !["success", "error", "warning"].includes(type)) {
    return null;
  }

  return (
    <AlertBanner
      key={`${type}-${message}`}
      message={message}
      onDismiss={() => {
        router.replace(cleanUrl, { scroll: false });
      }}
      type={type}
    />
  );
}
