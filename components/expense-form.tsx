import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { FormSubmitButton } from "@/components/form-submit-button";
import { RecurrenceActionDialog } from "@/components/recurrence-action-dialog";
import { Card } from "@/components/ui/card";
import { expenseStatusLabels, type Expense, type ExpenseOption, type ExpenseStatus } from "@/lib/expenses";

type ExpenseFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: ExpenseOption[];
  defaultExpense?: Expense | null;
  formId?: string;
  pockets: ExpenseOption[];
  title: string;
};

const statusOptions: ExpenseStatus[] = ["p", "pp", "ab"];

export function ExpenseForm({ action, categories, defaultExpense, formId = "despesa-form", pockets, title }: ExpenseFormProps) {
  const defaultCompetence = defaultExpense?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const isRecurring = Boolean(defaultExpense?.recurrence_group_id);

  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>{title}</h2>
      <form action={action} className="expense-edit-form" encType="multipart/form-data" id={formId}>
        {defaultExpense ? <input name="id" type="hidden" value={defaultExpense.id} /> : null}
        {defaultExpense?.recurrence_group_id ? <input name="recurrence_group_id" type="hidden" value={defaultExpense.recurrence_group_id} /> : null}
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
        {!defaultExpense ? (
          <label>
            <span>Repetir por</span>
            <div className="repeat-field">
              <input defaultValue={1} max={120} min={1} name="repeat_months" type="number" />
              <span>meses</span>
            </div>
          </label>
        ) : null}
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
        {isRecurring ? (
          <RecurrenceActionDialog
            allLabel="Editar todos os lancamentos recorrentes"
            cancelHref="/app/despesas"
            defaultOpen
            inline
            description="Escolha se a alteracao vale apenas para este lancamento ou para todo o grupo recorrente."
            formId={formId}
            singleLabel="Editar somente este lancamento"
            title="Editar lancamento recorrente"
          />
        ) : (
          <div className="form-actions">
            <FormSubmitButton pendingLabel="Enviando anexo...">Salvar</FormSubmitButton>
            <Link className="secondary-link-button" href="/app/despesas">Cancelar</Link>
          </div>
        )}
      </form>
    </Card>
  );
}
