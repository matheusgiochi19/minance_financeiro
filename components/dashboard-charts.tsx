"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { CategorySlice, MonthPoint, TrendItem } from "@/lib/dashboard";

const pieColors = ["#8b6df2", "#ff8384", "#47bad0", "#ffad61", "#4e7ff0", "#3c5d12"];

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value || 0));
}

type DashboardChartsProps = {
  categories: CategorySlice[];
  insights: {
    dominantCategory: (CategorySlice & { percentual: number }) | null;
    health: {
      cartoes: number;
      comprometida: number;
      livre: number;
    };
    projection: {
      proximos30: number;
    };
    saldoAcumulado: Array<{ label: string; saldo: number }>;
    tendencias: TrendItem[];
  };
  months: MonthPoint[];
  series: {
    despesas: number[];
    faturas: number[];
    receitas: number[];
  };
};

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

function useVisible() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { rootMargin: "160px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}

function PieChart({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.valor, 0);
  if (!total) return <div className="empty-chart">Sem despesas no mes atual</div>;

  const arcs = slices.reduce<Array<{ color: string; name: string; path: string; value: number }>>((acc, slice, index) => {
    const startAngle = acc.reduce((angle, item) => angle + (item.value / total) * 360, 0);
    const endAngle = startAngle + (slice.valor / total) * 360;
    acc.push({ color: pieColors[index % pieColors.length], name: slice.nome, path: describeArc(110, 110, 100, startAngle, endAngle), value: slice.valor });
    return acc;
  }, []);

  return (
    <div className="real-pie-wrap">
      <svg className="real-pie" viewBox="0 0 220 220" role="img" aria-label="Despesas por categoria">
        {arcs.map((arc) => <path d={arc.path} fill={arc.color} key={arc.name} />)}
      </svg>
      <div className="chart-legend-grid">
        {slices.map((slice, index) => <span key={slice.nome}><i style={{ background: pieColors[index % pieColors.length] }} />{slice.nome} {formatCurrency(slice.valor)}</span>)}
      </div>
    </div>
  );
}

function LineChart({ labels, tone = "invoice", values }: { labels: string[]; tone?: "balance" | "invoice"; values: number[] }) {
  const max = Math.max(...values.map((value) => Math.abs(value)), 1);
  const color = tone === "balance" ? "#4ca6a8" : "#cf66ff";
  const points = values.map((value, index) => {
    const x = 20 + index * (260 / Math.max(values.length - 1, 1));
    const y = 150 - (Math.max(value, 0) / max) * 120;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="line-chart" viewBox="0 0 320 180" role="img" aria-label={tone === "balance" ? "Evolucao de saldo" : "Faturas dos cartoes"}>
      <polyline fill="none" points={points} stroke={color} strokeLinecap="round" strokeWidth="5" />
      {values.map((value, index) => {
        const x = 20 + index * (260 / Math.max(values.length - 1, 1));
        const y = 150 - (Math.max(value, 0) / max) * 120;
        return <circle cx={x} cy={y} fill={color} key={`${labels[index]}-${value}`} r="5"><title>{formatCurrency(value)}</title></circle>;
      })}
      {labels.map((label, index) => <text className="line-chart-label" fontSize="10" key={label} textAnchor="middle" x={20 + index * (260 / Math.max(labels.length - 1, 1))} y="172">{label}</text>)}
    </svg>
  );
}

function DashboardChartsComponent({ categories, insights, months, series }: DashboardChartsProps) {
  const { ref, visible } = useVisible();
  const maxBar = Math.max(...series.receitas, ...series.despesas, 1);

  return (
    <div className="dashboard-grid real-dashboard-grid" ref={ref}>
      {!visible ? <div className="chart-lazy-placeholder">Carregando graficos...</div> : (
        <>
          <section className="chart-panel bar-panel" aria-label="Receita vs despesa">
            <h2>Receita vs Despesa</h2>
            <div className="bar-chart real-bar-chart">
              {months.map((month, index) => (
                <div className="bar-month" key={month.label}>
                  <div className="bars">
                    <i className="income-bar" style={{ height: `${Math.max((series.receitas[index] / maxBar) * 100, 4)}%` }} title={formatCurrency(series.receitas[index])} />
                    <i className="expense-bar" style={{ height: `${Math.max((series.despesas[index] / maxBar) * 100, 4)}%` }} title={formatCurrency(series.despesas[index])} />
                  </div>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
            <div className="legend"><span><i className="income-dot" />Receitas</span><span><i className="expense-dot" />Despesas</span></div>
          </section>
          <section className="chart-panel pie-panel" aria-label="Despesas por categorias"><h2>Despesas por Categoria</h2><PieChart slices={categories} /></section>
          <section className="chart-panel invoice-panel" aria-label="Faturas cartoes"><h2>Faturas Cartoes</h2><LineChart labels={months.map((month) => month.label)} values={series.faturas} /></section>
          <section className="chart-panel invoice-panel" aria-label="Evolucao de saldo"><h2>Evolucao de Saldo</h2><LineChart labels={insights.saldoAcumulado.map((item) => item.label)} tone="balance" values={insights.saldoAcumulado.map((item) => item.saldo)} /></section>
          <section className="chart-panel intelligence-panel" aria-label="Saude financeira">
            <h2>Saude Financeira</h2>
            <div className="insight-grid">
              <article><span>Renda comprometida</span><strong>{insights.health.comprometida}%</strong></article>
              <article><span>Disponivel</span><strong>{insights.health.livre}%</strong></article>
              <article><span>Cartoes</span><strong>{insights.health.cartoes}%</strong></article>
              <article><span>Proximos 30 dias</span><strong>{formatCurrency(insights.projection.proximos30)}</strong></article>
            </div>
          </section>
          <section className="chart-panel intelligence-panel" aria-label="Tendencia de gastos">
            <h2>Tendencia de Gastos</h2>
            <div className="trend-list">
              {insights.tendencias.length ? insights.tendencias.map((item) => <span key={item.nome}><b>{item.variacao > 0 ? "Alta" : "Queda"}</b>{item.nome}<strong>{formatCurrency(Math.abs(item.variacao))}</strong></span>) : <p className="empty-copy">Sem variacao relevante.</p>}
            </div>
          </section>
          <section className="chart-panel intelligence-panel" aria-label="Maior categoria de despesa">
            <h2>Maior Categoria</h2>
            {insights.dominantCategory ? <div className="dominant-card"><strong>{insights.dominantCategory.nome}</strong><span>{insights.dominantCategory.percentual}% das despesas do mes</span><small>{formatCurrency(insights.dominantCategory.valor)}</small></div> : <p className="empty-copy">Sem despesas no mes.</p>}
          </section>
        </>
      )}
    </div>
  );
}

export const DashboardCharts = memo(DashboardChartsComponent);
