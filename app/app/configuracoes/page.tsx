import { updateConfiguracoes } from "@/app/app/configuracoes/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";

export default async function ConfiguracoesPage() {
  const { profile } = await getCurrentProfile();
  const theme = profile?.theme_preference || "light";

  return (
    <section className="records-page">
      <div className="page-heading"><p>Sistema</p><h1>Configuracoes</h1><span>Ajuste preferencias gerais da sua conta.</span></div>
      <Card className="entity-form-card">
        <h2>Preferencias</h2>
        <form action={updateConfiguracoes} className="entity-form">
          <label><span>Juros por atraso (%)</span><input defaultValue={profile?.juros_atraso || 0} inputMode="decimal" name="juros_atraso" /></label>
          <label><span>Tema</span><select defaultValue={theme} name="theme_preference"><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <FormSubmitButton>Salvar</FormSubmitButton>
        </form>
      </Card>
    </section>
  );
}
