import { Card } from "@/components/ui/card";

const summaryCards = [
  { label: "Saldo Atual", value: "R$ 345,00", tone: "muted" },
  { label: "Receitas", value: "R$ 4.200,00", tone: "income" },
  { label: "Despesas", value: "R$ 3.855,00", tone: "expense" },
  { label: "Fatura Cartões", value: "R$ 690,00", tone: "cards" }
] as const;

const months = ["Jan 26", "Fev 26", "Mar 26", "Abr 26", "Mai 26", "Jun 26"];

export default function DashboardPage() {
  return (
    <section className="dashboard">
      <div className="welcome">
        <p>Bem-vindo</p>
        <h1>Bem-vindo</h1>
        <span>Abaixo, estão disponíveis as visões sobre o mês atual</span>
      </div>

      <div className="summary-grid">
        {summaryCards.map((card) => (
          <Card className="summary-card" key={card.label} tone={card.tone}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="chart-panel bar-panel" aria-label="Grafico de receitas e despesas">
          <div className="chart-scale">
            <span>4000K</span>
            <span>3000K</span>
            <span>2000K</span>
            <span>1000K</span>
          </div>
          <div className="bar-chart">
            {months.map((month, index) => (
              <div className="bar-month" key={month}>
                <div className="bars">
                  <i className="income-bar" style={{ height: `${92 - (index % 3) * 3}%` }} />
                  <i className="expense-bar" style={{ height: `${78 + (index % 2) * 4}%` }} />
                </div>
                <span>{month}</span>
              </div>
            ))}
          </div>
          <div className="legend">
            <span><i className="income-dot" />Receitas</span>
            <span><i className="expense-dot" />Despesas</span>
          </div>
        </section>

        <section className="chart-panel pie-panel" aria-label="Despesas por categorias">
          <h2>Despesas x Categorias</h2>
          <div className="pie-chart" />
        </section>

        <section className="chart-panel invoice-panel" aria-label="Faturas cartao">
          <h2>Faturas Cartão</h2>
          {["Jul", "Jun", "May", "Apr", "Mar", "Fev", "Jan"].map((label, index) => (
            <div className="invoice-row" key={label}>
              <span>{label}</span>
              <i style={{ width: `${24 + (6 - index) * 10}%` }}>{[99, 66, 123, 232, 400, 420, 690][index]}</i>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
