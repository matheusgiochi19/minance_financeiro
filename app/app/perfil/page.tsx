import { updateEmail, updatePassword, updateProfile } from "@/app/app/perfil/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ThemeSelect } from "@/components/theme-select";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";
import { normalizeThemePreference } from "@/lib/theme";

export default async function PerfilPage() {
  const { user, profile } = await getCurrentProfile();
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "";
  const theme = normalizeThemePreference(profile?.theme_preference);

  return (
    <section className="records-page">
      <div className="page-heading"><p>Conta</p><h1>Perfil</h1><span>Gerencie nome, acesso e preferencias da conta.</span></div>
      <div className="settings-grid">
        <Card className="entity-form-card">
          <h2>Identidade</h2>
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
          <h2>Tema</h2>
          <div className="entity-form">
            <label><span>Modo visual</span><ThemeSelect defaultValue={theme} key={theme} /></label>
          </div>
        </Card>
      </div>
    </section>
  );
}
