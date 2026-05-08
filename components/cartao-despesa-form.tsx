import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { expenseStatusLabels, formatCurrency, type ExpenseOption, type ExpenseStatus } from "@/lib/expenses";
import type { CartaoDespesa } from "@/lib/income-cards";

type CartaoDespesaFormProps = {
  action: (formData: FormData) => Promise<void>;
  cartaoId: string;
  categories: ExpenseOption[];
  defaultDespesa?: CartaoDespesa | null;
};

const statusOptions: ExpenseStatus[] = ["p", "pp", "ab"];

export function CartaoDespesaForm({ action, cartaoId, categories, defaultDespesa }: CartaoDespesaFormProps) {
  const defaultCompetence = defaultDespesa?.data_competencia || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  return (
    <Card className="entity-form-card expense-edit-card">
      <h2>Dados da despesa do cartão</h2>
      <form action={action} className="expense-edit-form">
        <input name="cartao_id" type="hidden" value={cartaoId} />
        {defaultDespesa ? <input name="id" type="hidden" value={defaultDespesa.id} /> : null}
        <label>
          <span>Descrição</span>
          <input defaultValue={defaultDespesa?.descricao || ""} maxLength={120} name="descricao" placeholder="Ex.: Mercado" required />
        </label>
        <label>
          <span>Valor</span>
          <input defaultValue={defaultDespesa ? formatCurrency(defaultDespesa.valor).replace("R$", "").trim() : ""} inputMode="decimal" name="valor" placeholder="0,00" required />
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={defaultDespesa?.status || "p"} name="status">
            {statusOptions.map((status) => <option key={status} value={status}>{expenseStatusLabels[status]}</option>)}
          </select>
        </label>
        <label>
          <span>Competência</span>
          <input defaultValue={defaultCompetence} name="data_competencia" type="date" required />
        </label>
        <label>
          <span>Categoria</span>
          <select defaultValue={defaultDespesa?.categoria_id || ""} name="categoria_id">
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
          </select>
        </label>
        <div className="form-actions">
          <Button type="submit">Salvar</Button>
          <Link className="secondary-link-button" href={`/app/cartoes/${cartaoId}/despesas`}>Cancelar</Link>
        </div>
      </form>
    </Card>
  );
}
