import Link from "next/link";
import { CurrencyInput } from "@/components/currency-input";
import { FormSubmitButton } from "@/components/form-submit-button";
import { RecurrenceActionDialog } from "@/components/recurrence-action-dialog";
import { Card } from "@/components/ui/card";
import { type ExpenseOption, type ExpenseStatus } from "@/lib/expenses";
import { cardExpenseStatusLabels } from "@/lib/income-cards";
import type { CartaoDespesa } from "@/lib/income-cards";

type CartaoDespesaFormProps = {
  action: (formData: FormData) => Promise<void>;
  cartaoId: string;
  categories: ExpenseOption[];
  defaultDespesa?: CartaoDespesa | null;
  formId?: string;
};

const statusOptions: ExpenseStatus[] = ["p", "pp", "ab"];

export function CartaoDespesaForm({ action, cartaoId, categories, defaultDespesa, formId = "cartao-despesa-form" }: CartaoDespesaFormProps) {
  const defaultCompetence = defaultDespesa?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const isRecurring = Boolean(defaultDespesa?.recurrence_group_id);

  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>Dados da despesa do cartão</h2>
      <form action={action} className="expense-edit-form" id={formId}>
        <input name="cartao_id" type="hidden" value={cartaoId} />
        {defaultDespesa ? <input name="id" type="hidden" value={defaultDespesa.id} /> : null}
        {defaultDespesa?.recurrence_group_id ? <input name="recurrence_group_id" type="hidden" value={defaultDespesa.recurrence_group_id} /> : null}
        <label>
          <span>Descrição</span>
          <input defaultValue={defaultDespesa?.descricao || ""} maxLength={120} name="descricao" placeholder="Ex.: Mercado" required />
        </label>
        <label>
          <span>Valor</span>
          <CurrencyInput defaultValue={defaultDespesa?.valor} name="valor" required />
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={defaultDespesa?.status || "p"} name="status">
            {statusOptions.map((status) => <option key={status} value={status}>{cardExpenseStatusLabels[status]}</option>)}
          </select>
        </label>
        <label>
          <span>Competência</span>
          <input defaultValue={defaultCompetence} name="data_competencia" type="date" required />
        </label>
        {!defaultDespesa ? (
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
          <select defaultValue={defaultDespesa?.categoria_id || ""} name="categoria_id">
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
          </select>
        </label>
        {isRecurring ? (
          <RecurrenceActionDialog
            allLabel="Editar todos os lancamentos recorrentes"
            cancelHref={`/app/cartoes/${cartaoId}/despesas`}
            defaultOpen
            inline
            description="Escolha se a alteracao vale apenas para este lancamento ou para todo o grupo recorrente."
            formId={formId}
            singleLabel="Editar somente este lancamento"
            title="Editar lancamento recorrente"
          />
        ) : (
          <div className="form-actions">
            <FormSubmitButton>Salvar</FormSubmitButton>
            <Link className="secondary-link-button" href={`/app/cartoes/${cartaoId}/despesas`}>Cancelar</Link>
          </div>
        )}
      </form>
    </Card>
  );
}
