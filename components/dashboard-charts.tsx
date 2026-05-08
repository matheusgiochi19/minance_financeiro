"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { CategorySlice, MonthPoint } from "@/lib/dashboard";

const pieColors = ["#8b6df2", "#ff8384", "#47bad0", "#ffad61", "#4e7ff0", "#3c5d12"];

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(Number(value || 0));
}

type DashboardChartsProps = {
  categories: CategorySlice[];
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
  if (!total) return <div className="empty-chart">Sem despesas no mês atual</div>;

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

function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = 20 + index * (260 / Math.max(values.length - 1, 1));
    const y = 150 - (value / max) * 120;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="line-chart" viewBox="0 0 320 180" role="img" aria-label="Faturas dos cartões">
      <polyline fill="none" points={points} stroke="#cf66ff" strokeLinecap="round" strokeWidth="5" />
      {values.map((value, index) => {
        const x = 20 + index * (260 / Math.max(values.length - 1, 1));
        const y = 150 - (value / max) * 120;
        return <circle cx={x} cy={y} fill="#cf66ff" key={`${labels[index]}-${value}`} r="5" />;
      })}
      {labels.map((label, index) => <text fill="rgba(34,40,57,0.62)" fontSize="10" key={label} textAnchor="middle" x={20 + index * (260 / Math.max(labels.length - 1, 1))} y="172">{label}</text>)}
    </svg>
  );
}

function DashboardChartsComponent({ categories, months, series }: DashboardChartsProps) {
  const { ref, visible } = useVisible();
  const maxBar = Math.max(...series.receitas, ...series.despesas, 1);

  return (
    <div className="dashboard-grid real-dashboard-grid" ref={ref}>
      {!visible ? <div className="chart-lazy-placeholder">Carregando gráficos...</div> : (
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
          <section className="chart-panel invoice-panel" aria-label="Faturas cartões"><h2>Faturas Cartões</h2><LineChart labels={months.map((month) => month.label)} values={series.faturas} /></section>
        </>
      )}
    </div>
  );
}

export const DashboardCharts = memo(DashboardChartsComponent);
