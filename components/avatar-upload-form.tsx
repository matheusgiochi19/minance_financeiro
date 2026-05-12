"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { uploadProfilePhoto, type AvatarUploadState } from "@/app/app/perfil/actions";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl || null);
  const displayUrl = state.avatarUrl || previewUrl;

  const feedbackClass = useMemo(() => (state.ok ? "form-message success" : "form-message"), [state.ok]);

  useEffect(() => {
    if (!state.ok || !state.avatarUrl) return;
    window.dispatchEvent(new CustomEvent("minance:avatar-updated", { detail: { avatarUrl: state.avatarUrl } }));
  }, [state.avatarUrl, state.ok]);

  return (
    <div className="avatar-upload-panel">
      {displayUrl ? <Image alt="" className="profile-photo" height={160} src={displayUrl} width={160} /> : <div className="profile-photo profile-photo-fallback">{fallbackInitial}</div>}
      <form action={formAction} className="entity-form" encType="multipart/form-data">
        <label>
          <span>Imagem</span>
          <input
            accept="image/jpeg,image/png,image/webp"
            disabled={isPending}
            name="foto"
            type="file"
            required
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setPreviewUrl(URL.createObjectURL(file));
            }}
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
