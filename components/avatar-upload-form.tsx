"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { uploadProfilePhoto, type AvatarUploadState } from "@/app/actions/profile-avatar";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";

type AvatarUploadFormProps = {
  fallbackInitial: string;
  initialAvatarUrl?: string | null;
};

const initialState: AvatarUploadState = {
  message: "",
  ok: false
};

export function AvatarUploadForm({ fallbackInitial, initialAvatarUrl }: AvatarUploadFormProps) {
  const [state, formAction, isPending] = useActionState(uploadProfilePhoto, initialState);
  const router = useRouter();
  void initialAvatarUrl;

  useEffect(() => {
    if (!state.ok) return;
    window.dispatchEvent(new CustomEvent("minance:profile-refresh"));
    router.refresh();
  }, [router, state.ok]);

  return (
    <div className="avatar-upload-panel">
      <div className="profile-photo profile-photo-fallback">{fallbackInitial}</div>
      <form action={formAction} className="entity-form" encType="multipart/form-data">
        <label>
          <span>Imagem</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={isPending}
            name="avatar"
            type="file"
            required
          />
        </label>
        <Button disabled={isPending} type="submit">
          {isPending ? <Loader2 aria-hidden className="spin" size={18} /> : null}
          {isPending ? "Enviando avatar..." : "Enviar avatar"}
        </Button>
        {state.message ? <AlertBanner key={`${state.ok ? "success" : "error"}-${state.message}`} message={state.message} type={state.ok ? "success" : "error"} /> : null}
      </form>
    </div>
  );
}
