const exactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

function formatExactCurrency(value: number) {
  if (Number.isInteger(value)) {
    return new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency"
    }).format(value);
  }

  return exactCurrencyFormatter.format(value);
}

function formatCompactNumber(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trimTrailingZero = (input: string) => input.replace(/,0$/, "");

  if (abs >= 1_000_000_000) {
    const normalized = trimTrailingZero((abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1).replace(".", ","));
    return `${sign}${normalized}bi`;
  }

  if (abs >= 1_000_000) {
    const normalized = trimTrailingZero((abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(".", ","));
    return `${sign}${normalized}mi`;
  }

  if (abs >= 1_000) {
    const normalized = trimTrailingZero((abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(".", ","));
    return `${sign}${normalized}k`;
  }

  return `${sign}${abs.toFixed(abs % 1 === 0 ? 0 : 2).replace(".", ",")}`;
}

export function formatCurrencyBRL(value: number | string | null | undefined, options?: { compact?: boolean }) {
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return "R$ 0";
  }

  if (options?.compact && Math.abs(numeric) >= 1_000) {
    return `R$ ${formatCompactNumber(numeric)}`;
  }

  return formatExactCurrency(numeric);
}

export function formatCurrencyAxis(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1_000_000_000) return `${formatCompactNumber(value)}`;
  if (Math.abs(value) >= 1_000) return `${formatCompactNumber(value)}`;
  return `${value % 1 === 0 ? value : Number(value.toFixed(2)).toString().replace(".", ",")}`;
}

export function formatCurrencyTooltip(value: number | string | null | undefined) {
  return formatCurrencyBRL(value);
}
