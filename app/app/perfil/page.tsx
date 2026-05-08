import Image from "next/image";
import { updateEmail, updatePassword, updateProfile, uploadProfilePhoto } from "@/app/app/perfil/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";

export default async function PerfilPage() {
  const { user, profile } = await getCurrentProfile();
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "";
  const initial = (fullName || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <section className="records-page">
      <div className="page-heading"><p>Conta</p><h1>Perfil</h1><span>Gerencie nome, acesso e avatar persistente.</span></div>
      <div className="settings-grid">
        <Card className="entity-form-card">
          <h2>Identidade</h2>
          <div className="profile-preview">
            {profile?.avatar_url ? <Image alt="" className="profile-photo" height={160} src={profile.avatar_url} width={160} /> : <div className="profile-photo profile-photo-fallback">{initial}</div>}
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
          <p className="muted-copy">Use uma imagem de até 50MB. O arquivo fica salvo no Storage e o link persistido no perfil.</p>
          <form action={uploadProfilePhoto} className="entity-form" encType="multipart/form-data">
            <label><span>Imagem</span><input accept="image/*" name="foto" type="file" required /></label>
            <FormSubmitButton pendingLabel="Enviando avatar...">Enviar avatar</FormSubmitButton>
          </form>
        </Card>
      </div>
    </section>
  );
}
