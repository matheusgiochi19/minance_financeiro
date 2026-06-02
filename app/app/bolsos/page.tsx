import Link from "next/link";
import { deleteBolso } from "@/app/app/bolsos/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { listUserRecords } from "@/lib/user-data";

export default async function BolsosPage() {
  const { data: bolsos, error } = await listUserRecords("bolsos");

  return (
    <section className="records-page">
      <div className="page-heading with-action">
        <div>
          <p>Cadastro</p>
          <h1>Bolsos</h1>
          <span>Cadastre contas, carteiras e lugares onde o dinheiro será controlado.</span>
        </div>
        <Link className="primary-button" href="/app/bolsos/novo">Novo bolso</Link>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar bolsos: {error.message}</p> : null}

      <TableWrap>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Nome</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {(bolsos || []).length === 0 ? (
              <TableRow>
                <TableCell className="empty-cell" colSpan={3}>Nenhum bolso cadastrado ainda.</TableCell>
              </TableRow>
            ) : null}
            {(bolsos || []).map((bolso) => (
              <TableRow key={bolso.id}>
                <TableCell><strong>{bolso.nome}</strong></TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(bolso.created_at))}</TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Link className="table-link-button" href={`/app/bolsos/${bolso.id}/editar`}>Editar</Link>
                    <form action={deleteBolso}>
                      <input name="id" type="hidden" value={bolso.id} />
                      <ConfirmSubmitButton message={`Excluir o bolso "${bolso.nome}"?`}>Excluir</ConfirmSubmitButton>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </section>
  );
}
