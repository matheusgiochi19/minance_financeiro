import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableWrap } from "@/components/ui/table";
import type { NamedUserRecord } from "@/lib/user-data";

type NamedRecordsManagerProps = {
  createAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  emptyText: string;
  inputPlaceholder: string;
  records: NamedUserRecord[];
  title: string;
  updateAction: (formData: FormData) => Promise<void>;
};

export function NamedRecordsManager({
  createAction,
  deleteAction,
  emptyText,
  inputPlaceholder,
  records,
  title,
  updateAction
}: NamedRecordsManagerProps) {
  return (
    <div className="records-layout">
      <Card className="record-form-card">
        <h2>Novo registro</h2>
        <form action={createAction} className="record-form">
          <label>
            <span>Nome</span>
            <input maxLength={80} name="nome" placeholder={inputPlaceholder} required />
          </label>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <TableWrap>
        <Table className="records-table">
          <TableHead>
            <TableRow>
              <TableHeader>{title}</TableHeader>
              <TableHeader>Criado em</TableHeader>
              <TableHeader>Ações</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell className="empty-cell" colSpan={3}>{emptyText}</TableCell>
              </TableRow>
            ) : null}
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <form action={updateAction} className="inline-edit-form">
                    <input name="id" type="hidden" value={record.id} />
                    <input aria-label={`Nome de ${record.nome}`} defaultValue={record.nome} maxLength={80} name="nome" required />
                    <Button size="sm" type="submit">Salvar</Button>
                  </form>
                </TableCell>
                <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(record.created_at))}</TableCell>
                <TableCell>
                  <form action={deleteAction}>
                    <input name="id" type="hidden" value={record.id} />
                    <Button size="sm" type="submit" variant="danger">Excluir</Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </div>
  );
}
