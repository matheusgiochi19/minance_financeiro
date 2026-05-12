import Image from "next/image";
import { updateEmail, updatePassword, updateProfile } from "@/app/app/perfil/actions";
import { AvatarUploadForm } from "@/components/avatar-upload-form";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { getAvatarDisplayUrl, getCurrentProfile } from "@/lib/profiles";

export default async function PerfilPage() {
  const { user, profile } = await getCurrentProfile();
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "";
  const initial = (fullName || user?.email || "U").slice(0, 1).toUpperCase();
  const avatarUrl = getAvatarDisplayUrl(profile);

  return (
    <section className="records-page">
      <div className="page-heading"><p>Conta</p><h1>Perfil</h1><span>Gerencie nome, acesso e avatar persistente.</span></div>
      <div className="settings-grid">
        <Card className="entity-form-card">
          <h2>Identidade</h2>
          <div className="profile-preview">
            {avatarUrl ? <Image alt="" className="profile-photo" height={160} src={avatarUrl} width={160} /> : <div className="profile-photo profile-photo-fallback">{initial}</div>}
            <strong>{fullName || "Seu nome"}</strong>
          </div>
          <form action={updateProfile} className="entity-form">
            <label><span>Nome completo</span><input defaultValue={fullName} name="full_name" required /></label>
            <FormSubmitButton>Salvar nome</FormSubmitButton>
          </form>
        </Card>
        <Card className="entity-form-card">
          <h2>E-mail</h2>
          <form action={updateEmail} className="entity-form"><label><span>Novo e-mail</span><input defaultValue={user?.email || ""} name="email" type="email" required /></label><FormSubmitButton>Salvar e-mail</FormSubmitButton></form>
        </Card>
        <Card className="entity-form-card">
          <h2>Senha</h2>
          <form action={updatePassword} className="entity-form"><label><span>Nova senha</span><input minLength={6} name="password" type="password" required /></label><FormSubmitButton>Alterar senha</FormSubmitButton></form>
        </Card>
        <Card className="entity-form-card">
          <h2>Avatar</h2>
          <p className="muted-copy">Use JPG, PNG, WEBP ou GIF de até 50MB. O avatar atualiza na navegação assim que o upload termina.</p>
          <AvatarUploadForm fallbackInitial={initial} initialAvatarUrl={avatarUrl} />
        </Card>
      </div>
    </section>
  );
}
