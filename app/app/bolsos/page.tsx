import { createBolso, deleteBolso, updateBolso } from "@/app/app/bolsos/actions";
import { NamedRecordsManager } from "@/components/named-records-manager";
import { listUserRecords } from "@/lib/user-data";

export default async function BolsosPage() {
  const { data: bolsos, error } = await listUserRecords("bolsos");

  return (
    <section className="records-page">
      <div className="page-heading">
        <p>Cadastro</p>
        <h1>Bolsos</h1>
        <span>Cadastre contas, carteiras e lugares onde o dinheiro será controlado.</span>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar bolsos: {error.message}</p> : null}

      <NamedRecordsManager
        createAction={createBolso}
        deleteAction={deleteBolso}
        emptyText="Nenhum bolso cadastrado ainda."
        inputPlaceholder="Ex.: Nubank Matheus"
        records={bolsos || []}
        title="Bolso"
        updateAction={updateBolso}
      />
    </section>
  );
}
