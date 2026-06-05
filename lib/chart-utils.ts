import { CHART_COLORS } from "@/lib/chart-config";
import { formatCurrencyAxis } from "@/utils/formatters/currency";

export type ChartPoint = {
  x: number;
  y: number;
  value: number;
};

export type PreparedPieSlice = {
  color: string;
  displayName: string;
  name: string;
  percent: number;
  value: number;
};

function niceStep(rawStep: number) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1;

  const exponent = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / 10 ** exponent;
  let niceFraction = 1;

  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
}

export function buildMonetaryTicks(maxValue: number, desiredTickCount = 5) {
  const safeMax = Math.max(0, Number(maxValue || 0));

  if (safeMax === 0) {
    return [0, 1];
  }

  const step = niceStep(safeMax / Math.max(1, desiredTickCount - 1));
  const top = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];

  for (let value = 0; value <= top; value += step) {
    ticks.push(value);
  }

  return ticks;
}

export function buildSeriesPoints(values: number[], bounds: { height: number; paddingBottom: number; paddingLeft: number; paddingRight: number; paddingTop: number }) {
  const width = 1000;
  const innerWidth = width - bounds.paddingLeft - bounds.paddingRight;
  const innerHeight = bounds.height - bounds.paddingTop - bounds.paddingBottom;
  const maxValue = Math.max(...values.map((value) => Math.abs(value)), 1);
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values.map((value, index) => {
    const x = bounds.paddingLeft + stepX * index;
    const y = bounds.paddingTop + innerHeight - (Math.max(value, 0) / maxValue) * innerHeight;
    return { value, x, y };
  });
}

export function buildSmoothPath(points: ChartPoint[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const previous = points[index - 1] ?? current;
    const after = points[index + 2] ?? next;

    const cp1x = current.x + (next.x - previous.x) / 6;
    const cp1y = current.y + (next.y - previous.y) / 6;
    const cp2x = next.x - (after.x - current.x) / 6;
    const cp2y = next.y - (after.y - current.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return path;
}

export function preparePieSlices(
  slices: Array<{ nome: string; valor: number }>,
  options?: { thresholdPercent?: number }
): PreparedPieSlice[] {
  const thresholdPercent = options?.thresholdPercent ?? 3;
  const ordered = [...slices].sort((left, right) => right.valor - left.valor);
  const total = ordered.reduce((sum, slice) => sum + Number(slice.valor || 0), 0);

  if (!total) {
    return [];
  }

  const visibleSlices = ordered.filter((slice) => (slice.valor / total) * 100 >= thresholdPercent);
  const hiddenTotal = ordered
    .filter((slice) => !visibleSlices.includes(slice))
    .reduce((sum, slice) => sum + Number(slice.valor || 0), 0);

  const grouped = hiddenTotal > 0
    ? [...visibleSlices, { nome: "Outros", valor: hiddenTotal }]
    : visibleSlices;

  return grouped.map((slice, index) => {
    const value = Number(slice.valor || 0);
    const percent = Math.round((value / total) * 100);

    return {
      color: CHART_COLORS.palette[index % CHART_COLORS.palette.length],
      displayName: slice.nome,
      name: slice.nome,
      percent,
      value
    };
  });
}

export function sortSlicesDesc<T extends { valor: number }>(slices: T[]) {
  return [...slices].sort((left, right) => right.valor - left.valor);
}

export function formatAxisValue(value: number) {
  return formatCurrencyAxis(value);
}

