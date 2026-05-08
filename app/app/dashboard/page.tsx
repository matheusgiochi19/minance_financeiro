import { DashboardCharts } from "@/components/dashboard-charts";
import { MonthFilter } from "@/components/month-filter";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";
import { getPeriodoMes } from "@/services/finance.service";

type DashboardPageProps = { searchParams: Promise<{ mes?: string }> };

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const periodo = getPeriodoMes(params.mes);
  const data = await getDashboardData(periodo.mes);

  return (
    <section className="dashboard">
      <div className="welcome">
        <p>Bem-vindo</p>
        <h1>Minance</h1>
        <span>Visão consolidada entre mês passado, mês atual e próximos 4 meses.</span>
      </div>
      <MonthFilter month={periodo.mes} />

      <div className="summary-grid">
        <Card className="summary-card" tone="muted"><span>Saldo Atual</span><strong>{data.formatted.saldo}</strong></Card>
        <Card className="summary-card" tone="income"><span>Receitas</span><strong>{data.formatted.receitas}</strong></Card>
        <Card className="summary-card" tone="expense"><span>Despesas</span><strong>{data.formatted.despesas}</strong></Card>
        <Card className="summary-card" tone="cards"><span>Fatura Cartões</span><strong>{data.formatted.faturas}</strong></Card>
      </div>

      <DashboardCharts categories={data.categories} months={data.months} series={data.series} />
    </section>
  );
}
