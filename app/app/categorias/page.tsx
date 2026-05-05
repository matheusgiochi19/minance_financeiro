import Link from "next/link";
import { deleteCategoria } from "@/app/app/categorias/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import { listUserRecords } from "@/lib/user-data";

export default async function CategoriasPage() {
  const { data: categorias, error } = await listUserRecords("categorias");

  return (
    <section className="records-page">
      <div className="page-heading with-action">
        <div>
          <p>Cadastro</p>
          <h1>Categorias</h1>
          <span>Organize os tipos de receitas e despesas que serão usados nos lançamentos.</span>
        </div>
        <Link className="primary-button" href="/app/categorias/nova">Nova categoria</Link>
      </div>

      {error ? <p className="admin-alert">Não foi possível carregar categorias: {error.message}</p> : null}

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
            {(categorias || []).length === 0 ? (
              <TableRow>
                <TableCell className="empty-cell" colSpan={3}>Nenhuma categoria cadastrada ainda.</TableCell>
              </TableRow>
            ) : null}
            {(categorias || []).map((categoria) => (
              <TableRow key={categoria.id}>
                <TableCell><strong>{categoria.nome}</strong></TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(categoria.created_at))}</TableCell>
                <TableCell>
                  <div className="table-actions">
                    <Link className="table-link-button" href={`/app/categorias/${categoria.id}/editar`}>Editar</Link>
                    <form action={deleteCategoria}>
                      <input name="id" type="hidden" value={categoria.id} />
                      <ConfirmSubmitButton message={`Excluir a categoria "${categoria.nome}"?`}>Excluir</ConfirmSubmitButton>
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
