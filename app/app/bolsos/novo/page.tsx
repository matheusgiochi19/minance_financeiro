import { createBolso } from "@/app/app/bolsos/actions";
import { NamedRecordForm } from "@/components/named-record-form";

export default function NovoBolsoPage() {
  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Novo bolso</h1>
        <span>Crie uma conta ou carteira para controlar seus lançamentos.</span>
      </div>
      <NamedRecordForm action={createBolso} cancelHref="/app/bolsos" placeholder="Ex.: Nubank Matheus" title="Dados do bolso" />
    </section>
  );
}
