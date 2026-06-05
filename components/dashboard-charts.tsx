"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { CategorySlice, MonthPoint, TrendItem } from "@/lib/dashboard";
import { CHART_COLORS, CHART_LAYOUT, CHART_TEXT } from "@/lib/chart-config";
import {
  buildMonetaryTicks,
  buildSeriesPoints,
  buildSmoothPath,
  preparePieSlices,
  sortSlicesDesc
} from "@/lib/chart-utils";
import { formatCurrencyBRL, formatCurrencyTooltip } from "@/utils/formatters/currency";

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
    despesasComuns: number[];
    faturas: number[];
    receitas: number[];
  };
};

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

function ChartGrid({
  ticks,
  width,
  height,
  left,
  right,
  top,
  bottom
}: {
  bottom: number;
  height: number;
  left: number;
  right: number;
  ticks: number[];
  top: number;
  width: number;
}) {
  const innerHeight = height - top - bottom;
  const innerWidth = width - left - right;
  const maxValue = ticks[ticks.length - 1] || 1;

  return (
    <g aria-hidden="true">
      {ticks.map((tick) => {
        const y = top + innerHeight - (tick / maxValue) * innerHeight;
        return <line key={tick} x1={left} x2={left + innerWidth} y1={y} y2={y} stroke={CHART_COLORS.grid} strokeWidth="1" />;
      })}
    </g>
  );
}

function MonetaryAxis({
  ticks,
  width,
  height,
  left,
  right,
  top,
  bottom
}: {
  bottom: number;
  height: number;
  left: number;
  right: number;
  ticks: number[];
  top: number;
  width: number;
}) {
  const innerHeight = height - top - bottom;
  const innerWidth = width - left - right;
  const maxValue = ticks[ticks.length - 1] || 1;

  return (
    <g aria-hidden="true">
      <line x1={left} x2={left + innerWidth} y1={top + innerHeight} y2={top + innerHeight} stroke={CHART_COLORS.grid} strokeWidth="1.5" />
      {ticks.map((tick) => {
        const y = top + innerHeight - (tick / maxValue) * innerHeight;
        return (
          <g key={tick}>
            <text fill={CHART_TEXT.axis} fontSize="11" textAnchor="end" x={left - 10} y={y + 4}>
              {tick === 0 ? "0" : formatCurrencyBRL(tick, { compact: true }).replace("R$ ", "")}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ValueBadge({
  x,
  y,
  label
}: {
  label: string;
  x: number;
  y: number;
}) {
  const width = Math.max(42, label.length * 6.2);
  return (
    <g transform={`translate(${x - width / 2}, ${y})`}>
      <rect fill={CHART_COLORS.labelBg} height="20" rx="8" ry="8" width={width} />
      <text fill={CHART_COLORS.labelText} fontSize="10" fontWeight="700" textAnchor="middle" x={width / 2} y="13">
        {label}
      </text>
    </g>
  );
}

function BarChart({ months, receitaValues, despesaValues }: { despesaValues: number[]; months: MonthPoint[]; receitaValues: number[] }) {
  const width = 1000;
  const height = CHART_LAYOUT.bar.height;
  const { paddingLeft: left, paddingRight: right, paddingTop: top, paddingBottom: bottom } = CHART_LAYOUT.bar;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const ticks = buildMonetaryTicks(Math.max(...receitaValues, ...despesaValues, 1), 5);
  const maxValue = ticks[ticks.length - 1] || 1;
  const groupWidth = innerWidth / Math.max(months.length, 1);
  const barWidth = Math.min(34, groupWidth * 0.26);
  const barGap = Math.min(12, groupWidth * 0.12);

  return (
    <svg className="chart-svg chart-svg-bar" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Receitas versus despesas">
      <ChartGrid bottom={bottom} height={height} left={left} right={right} ticks={ticks} top={top} width={width} />
      <MonetaryAxis bottom={bottom} height={height} left={left} right={right} ticks={ticks} top={top} width={width} />
      {months.map((month, index) => {
        const center = left + groupWidth * index + groupWidth / 2;
        const receitaHeight = (Math.max(receitaValues[index] || 0, 0) / maxValue) * innerHeight;
        const despesaHeight = (Math.max(despesaValues[index] || 0, 0) / maxValue) * innerHeight;
        const receitaX = center - barWidth - barGap / 2;
        const despesaX = center + barGap / 2;
        const receitaY = top + innerHeight - receitaHeight;
        const despesaY = top + innerHeight - despesaHeight;

        return (
          <g key={month.label}>
            <g>
              <rect
                fill={CHART_COLORS.income}
                height={Math.max(receitaHeight, 6)}
                rx="8"
                ry="8"
                width={barWidth}
                x={receitaX}
                y={receitaY}
              >
                <title>{`${month.label} - Receitas: ${formatCurrencyTooltip(receitaValues[index] || 0)}`}</title>
              </rect>
              <ValueBadge label={formatCurrencyBRL(receitaValues[index] || 0, { compact: true })} x={receitaX + barWidth / 2} y={Math.max(receitaY - 26, 4)} />
            </g>
            <g>
              <rect
                fill={CHART_COLORS.expense}
                height={Math.max(despesaHeight, 6)}
                rx="8"
                ry="8"
                width={barWidth}
                x={despesaX}
                y={despesaY}
              >
                <title>{`${month.label} - Despesas: ${formatCurrencyTooltip(despesaValues[index] || 0)}`}</title>
              </rect>
              <ValueBadge label={formatCurrencyBRL(despesaValues[index] || 0, { compact: true })} x={despesaX + barWidth / 2} y={Math.max(despesaY - 26, 4)} />
            </g>
            <text fill={CHART_TEXT.axis} fontSize="11" textAnchor="middle" x={center} y={height - 12}>
              {month.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({
  labels,
  series,
  title,
  tone = "balance"
}: {
  labels: string[];
  series: Array<{ color: string; label: string; values: number[] }>;
  title: string;
  tone?: "balance" | "invoice";
}) {
  const width = 1000;
  const height = CHART_LAYOUT.line.height;
  const { paddingLeft: left, paddingRight: right, paddingTop: top, paddingBottom: bottom } = CHART_LAYOUT.line;
  const innerHeight = height - top - bottom;
  const maxValue = Math.max(...series.flatMap((item) => item.values), 1);
  const ticks = buildMonetaryTicks(maxValue, 5);
  const lineWidth = tone === "balance" ? 4.5 : 4;

  return (
    <svg className="chart-svg chart-svg-line" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <ChartGrid bottom={bottom} height={height} left={left} right={right} ticks={ticks} top={top} width={width} />
      <MonetaryAxis bottom={bottom} height={height} left={left} right={right} ticks={ticks} top={top} width={width} />
      {series.map((item, seriesIndex) => {
        const points = buildSeriesPoints(item.values, CHART_LAYOUT.line);
        const path = buildSmoothPath(points);

        return (
          <g key={item.label}>
            <path d={path} fill="none" stroke={item.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={lineWidth} />
            {points.map((point, index) => {
              const alignAbove = index % 2 === 0 || point.y > top + innerHeight * 0.45;
              const labelY = alignAbove ? point.y - 28 : point.y + 10;
              const pointColor = seriesIndex === 0 ? item.color : CHART_COLORS.palette[(seriesIndex + 1) % CHART_COLORS.palette.length];
              return (
                <g key={`${item.label}-${index}`}>
                  <circle cx={point.x} cy={point.y} fill="#fff" r="7" stroke={pointColor} strokeWidth="4" />
                  <circle cx={point.x} cy={point.y} fill={pointColor} r="4" />
                  <ValueBadge label={formatCurrencyBRL(point.value, { compact: true })} x={point.x} y={Math.max(labelY, 4)} />
                  <title>{`${item.label} - ${labels[index]}: ${formatCurrencyTooltip(point.value)}`}</title>
                </g>
              );
            })}
          </g>
        );
      })}
      {labels.map((label, index) => {
        const points = buildSeriesPoints(series[0].values, CHART_LAYOUT.line);
        return (
          <text key={label} fill={CHART_TEXT.axis} fontSize="11" textAnchor="middle" x={points[index]?.x || 0} y={height - 12}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function PieChart({ slices }: { slices: CategorySlice[] }) {
  const prepared = preparePieSlices(sortSlicesDesc(slices));
  const total = prepared.reduce((sum, slice) => sum + slice.value, 0);

  if (!total) {
    return <div className="empty-chart">Sem despesas no mes atual</div>;
  }

  const cx = 160;
  const cy = 150;
  const radius = 102;
  const labelRadius = 128;
  const arcs = prepared.reduce<Array<{
    anchor: { x: number; y: number };
    endAngle: number;
    leaderStart: { x: number; y: number };
    path: string;
    slice: (typeof prepared)[number];
    startAngle: number;
    textAnchor: "end" | "start";
  }>>((acc, slice) => {
    const previous = acc[acc.length - 1];
    const startAngle = previous?.endAngle ?? 0;
    const sweepAngle = (slice.value / total) * 360;
    const endAngle = startAngle + sweepAngle;
    const midAngle = startAngle + sweepAngle / 2;
    const anchor = polarToCartesian(cx, cy, labelRadius, midAngle);
    const textAnchor = anchor.x >= cx ? "start" : "end";
    const leaderStart = polarToCartesian(cx, cy, radius - 4, midAngle);

    acc.push({
      anchor,
      endAngle,
      leaderStart,
      path: describeArc(cx, cy, radius, startAngle, endAngle),
      slice,
      startAngle,
      textAnchor
    });

    return acc;
  }, []);

  return (
    <div className="real-pie-wrap">
      <svg className="real-pie" viewBox="0 0 320 300" role="img" aria-label="Despesas por categoria">
        <circle cx={cx} cy={cy} fill="rgba(255,255,255,0.4)" r={radius + 10} />
        {arcs.map(({ anchor, leaderStart, path, slice, textAnchor }) => {
          return (
            <g key={slice.name}>
              <path d={path} fill={slice.color} stroke="rgba(255,255,255,0.55)" strokeWidth="1.5">
                <title>{`${slice.displayName} - ${slice.percent}% - ${formatCurrencyTooltip(slice.value)}`}</title>
              </path>
              <line
                x1={leaderStart.x}
                x2={anchor.x - (textAnchor === "start" ? 10 : -10)}
                y1={leaderStart.y}
                y2={anchor.y}
                stroke={slice.color}
                strokeWidth="1.4"
              />
              <circle cx={anchor.x} cy={anchor.y} fill={slice.color} r="2.8" />
              <text fill={CHART_TEXT.label} fontSize="11" fontWeight="700" textAnchor={textAnchor} x={anchor.x} y={anchor.y - 4}>
                {slice.displayName}
              </text>
              <text fill={CHART_TEXT.axis} fontSize="10" textAnchor={textAnchor} x={anchor.x} y={anchor.y + 10}>
                {`${slice.percent}% - ${formatCurrencyBRL(slice.value, { compact: true })}`}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} fill="rgba(255,255,255,0.84)" r="44" />
        <text fill={CHART_TEXT.label} fontSize="13" fontWeight="700" textAnchor="middle" x={cx} y={cy - 2}>
          Total
        </text>
        <text fill={CHART_TEXT.axis} fontSize="14" fontWeight="800" textAnchor="middle" x={cx} y={cy + 18}>
          {formatCurrencyBRL(total, { compact: true })}
        </text>
      </svg>
      <div className="chart-legend-grid">
        {prepared.map((slice) => (
          <span key={slice.name}>
            <i style={{ background: slice.color }} />
            <b>{slice.displayName}</b>
            <small>{`${slice.percent}%`}</small>
            <strong>{formatCurrencyBRL(slice.value, { compact: true })}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function DashboardChartsComponent({ categories, insights, months, series }: DashboardChartsProps) {
  const { ref, visible } = useVisible();
  const expenseSeries = series.despesas;
  const incomeSeries = series.receitas;
  const invoiceSeries = series.faturas;
  const balanceSeries = insights.saldoAcumulado.map((item) => item.saldo);

  return (
    <div className="dashboard-grid real-dashboard-grid" ref={ref}>
      {!visible ? (
        <div className="chart-lazy-placeholder">Carregando graficos...</div>
      ) : (
        <>
          <section className="chart-panel bar-panel" aria-label="Receita vs despesa">
            <h2>Receita vs Despesa</h2>
            <BarChart despesaValues={expenseSeries} months={months} receitaValues={incomeSeries} />
            <div className="legend">
              <span><i className="income-dot" />Receitas</span>
              <span><i className="expense-dot" />Despesas totais</span>
            </div>
          </section>

          <section className="chart-panel pie-panel" aria-label="Despesas por categorias">
            <h2>Despesas por Categoria</h2>
            <PieChart slices={categories} />
          </section>

          <section className="chart-panel invoice-panel" aria-label="Faturas cartoes">
            <h2>Faturas Cartoes</h2>
            <LineChart
              labels={months.map((month) => month.label)}
              series={[{ color: CHART_COLORS.card, label: "Faturas", values: invoiceSeries }]}
              title="Faturas dos cartoes"
              tone="invoice"
            />
          </section>

          <section className="chart-panel invoice-panel" aria-label="Evolucao de saldo">
            <h2>Evolucao de Saldo</h2>
            <LineChart
              labels={insights.saldoAcumulado.map((item) => item.label)}
              series={[{ color: CHART_COLORS.balance, label: "Saldo", values: balanceSeries }]}
              title="Evolucao de saldo"
              tone="balance"
            />
          </section>

          <section className="chart-panel intelligence-panel" aria-label="Saude financeira">
            <h2>Saude Financeira</h2>
            <div className="insight-grid">
              <article><span>Renda comprometida</span><strong>{insights.health.comprometida}%</strong></article>
              <article><span>Disponivel</span><strong>{insights.health.livre}%</strong></article>
              <article><span>Cartoes</span><strong>{insights.health.cartoes}%</strong></article>
              <article><span>Proximos 30 dias</span><strong>{formatCurrencyBRL(insights.projection.proximos30)}</strong></article>
            </div>
          </section>

          <section className="chart-panel intelligence-panel" aria-label="Tendencia de gastos">
            <h2>Tendencia de Gastos</h2>
            <div className="trend-list">
              {insights.tendencias.length ? insights.tendencias.map((item) => (
                <span key={item.nome}>
                  <b>{item.variacao > 0 ? "Alta" : "Queda"}</b>
                  {item.nome}
                  <strong>{formatCurrencyBRL(Math.abs(item.variacao))}</strong>
                </span>
              )) : <p className="empty-copy">Sem variacao relevante.</p>}
            </div>
          </section>

          <section className="chart-panel intelligence-panel" aria-label="Maior categoria de despesa">
            <h2>Maior Categoria</h2>
            {insights.dominantCategory ? (
              <div className="dominant-card">
                <strong>{insights.dominantCategory.nome}</strong>
                <span>{insights.dominantCategory.percentual}% das despesas do mes</span>
                <small>{formatCurrencyBRL(insights.dominantCategory.valor)}</small>
              </div>
            ) : (
              <p className="empty-copy">Sem despesas no mes.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export const DashboardCharts = memo(DashboardChartsComponent);
