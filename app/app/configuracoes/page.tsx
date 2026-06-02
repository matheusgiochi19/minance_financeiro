import { updateConfiguracoes } from "@/app/app/configuracoes/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { ThemeSelect } from "@/components/theme-select";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";
import { APP_VERSION } from "@/lib/version";
import { normalizeThemePreference } from "@/lib/theme";

export default async function ConfiguracoesPage() {
  const { profile } = await getCurrentProfile();
  const theme = normalizeThemePreference(profile?.theme_preference);

  return (
    <section className="records-page">
      <div className="page-heading"><p>Sistema</p><h1>Configuracoes</h1><span>Ajuste preferencias gerais da sua conta.</span></div>
      <Card className="entity-form-card">
        <h2>Preferencias</h2>
        <form action={updateConfiguracoes} className="entity-form">
          <label><span>Juros por atraso (%)</span><input defaultValue={profile?.juros_atraso || 0} inputMode="decimal" name="juros_atraso" /></label>
          <label><span>Tema</span><ThemeSelect defaultValue={theme} key={theme} /></label>
          <FormSubmitButton>Salvar</FormSubmitButton>
        </form>
        <p className="settings-version">{APP_VERSION}</p>
      </Card>
    </section>
  );
}
