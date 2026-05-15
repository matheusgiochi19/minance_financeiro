"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { uploadProfilePhoto, type AvatarUploadState } from "@/app/actions/profile-avatar";
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

  const feedbackClass = useMemo(() => (state.ok ? "form-message success" : "form-message"), [state.ok]);

  useEffect(() => {
    if (!state.ok) return;
    window.dispatchEvent(new CustomEvent("minance:profile-refresh"));
    router.refresh();
  }, [router, state.ok]);

  return (
    <div className="avatar-upload-panel">
      {initialAvatarUrl ? <Image alt="" className="profile-photo" height={160} src={initialAvatarUrl} width={160} /> : <div className="profile-photo profile-photo-fallback">{fallbackInitial}</div>}
      <form action={formAction} className="entity-form" encType="multipart/form-data">
        <label>
          <span>Imagem</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={isPending}
            name="foto"
            type="file"
            required
          />
        </label>
        <Button disabled={isPending} type="submit">
          {isPending ? <Loader2 aria-hidden className="spin" size={18} /> : null}
          {isPending ? "Enviando avatar..." : "Enviar avatar"}
        </Button>
        {state.message ? <p className={feedbackClass}>{state.message}</p> : null}
      </form>
    </div>
  );
}
