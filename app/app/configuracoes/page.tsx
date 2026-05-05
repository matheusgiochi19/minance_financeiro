import { updateConfiguracoes } from "@/app/app/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/profiles";

export default async function ConfiguracoesPage() {
  const { profile } = await getCurrentProfile();
  return (
    <section className="records-page">
      <div className="page-heading"><p>Sistema</p><h1>Configurações</h1><span>Ajuste preferências gerais da sua conta.</span></div>
      <Card className="entity-form-card">
        <h2>Preferências</h2>
        <form action={updateConfiguracoes} className="entity-form">
          <label><span>Juros por atraso (%)</span><input defaultValue={profile?.juros_atraso || 0} inputMode="decimal" name="juros_atraso" /></label>
          <label><span>Tema</span><select defaultValue={profile?.tema || "light"} name="tema"><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <Button type="submit">Salvar</Button>
        </form>
      </Card>
    </section>
  );
}
