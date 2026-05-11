import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Card } from "@/components/ui/card";
import { expenseStatusLabels, type Expense, type ExpenseOption, type ExpenseStatus } from "@/lib/expenses";

type ExpenseFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ExpenseOption[];
  defaultExpense?: Expense | null;
  pockets: ExpenseOption[];
  title: string;
};

const statusOptions: ExpenseStatus[] = ["p", "pp", "ab"];

export function ExpenseForm({ action, categories, defaultExpense, pockets, title }: ExpenseFormProps) {
  const defaultCompetence = defaultExpense?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>{title}</h2>
      <form action={action} className="expense-edit-form" encType="multipart/form-data">
        {defaultExpense ? <input name="id" type="hidden" value={defaultExpense.id} /> : null}
        <label>
          <span>Descrição</span>
          <input defaultValue={defaultExpense?.descricao || ""} maxLength={120} name="descricao" placeholder="Ex.: Aluguel" required />
        </label>
        <label>
          <span>Valor</span>
          <CurrencyInput defaultValue={defaultExpense?.valor} name="valor" required />
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={defaultExpense?.status || "p"} name="status">
            {statusOptions.map((status) => (
              <option key={status} value={status}>{expenseStatusLabels[status]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Competência</span>
          <input defaultValue={defaultCompetence} name="data_competencia" type="date" required />
        </label>
        <label>
          <span>Categoria</span>
          <select defaultValue={defaultExpense?.categoria_id || ""} name="categoria_id">
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.nome}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Bolso</span>
          <select defaultValue={defaultExpense?.bolso_id || ""} name="bolso_id">
            <option value="">Sem bolso</option>
            {pockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>{pocket.nome}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Anexo</span>
          <input name="anexo" type="file" />
        </label>
        {defaultExpense?.anexo_nome ? <p className="current-attachment">Anexo atual: {defaultExpense.anexo_nome}</p> : null}
        <div className="form-actions">
          <FormSubmitButton pendingLabel="Enviando anexo...">Salvar</FormSubmitButton>
          <Link className="secondary-link-button" href="/app/despesas">Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
