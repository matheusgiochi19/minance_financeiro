import { updateEmail, updatePassword, uploadProfilePhoto } from "@/app/app/perfil/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const { user, profile } = await getCurrentProfile();
  const supabase = await createClient();
  const photo = profile?.foto_path ? await supabase.storage.from("perfil-fotos").createSignedUrl(profile.foto_path, 600) : null;

  return (
    <section className="records-page">
      <div className="page-heading"><p>Conta</p><h1>Perfil</h1><span>Gerencie acesso, e-mail e foto de perfil.</span></div>
      <div className="settings-grid">
        <Card className="entity-form-card">
          <h2>E-mail</h2>
          <form action={updateEmail} className="entity-form"><label><span>Novo e-mail</span><input defaultValue={user?.email || ""} name="email" type="email" required /></label><Button type="submit">Salvar e-mail</Button></form>
        </Card>
        <Card className="entity-form-card">
          <h2>Senha</h2>
          <form action={updatePassword} className="entity-form"><label><span>Nova senha</span><input minLength={6} name="password" type="password" required /></label><Button type="submit">Alterar senha</Button></form>
        </Card>
        <Card className="entity-form-card">
          <h2>Foto</h2>
          {photo?.data?.signedUrl ? <div aria-label="Foto do perfil" className="profile-photo" role="img" style={{ backgroundImage: `url(${photo.data.signedUrl})` }} /> : null}
          <form action={uploadProfilePhoto} className="entity-form" encType="multipart/form-data"><label><span>Imagem até 50MB</span><input accept="image/*" name="foto" type="file" required /></label><Button type="submit">Enviar foto</Button></form>
        </Card>
      </div>
    </section>
  );
}
