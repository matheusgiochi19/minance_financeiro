export function onlyCurrencyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCurrencyInput(value: string | number | null | undefined) {
  const digits = onlyCurrencyDigits(String(value ?? ""));
  const cents = Number(digits || "0");

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency"
  }).format(cents / 100);
}

export function formatCurrencyFromNumber(value: string | number | null | undefined) {
  const numeric = Number(value || 0);
  const cents = Math.round(numeric * 100);
  return formatCurrencyInput(String(cents));
}

export function parseCurrencyToNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const digits = onlyCurrencyDigits(String(value ?? ""));
  return Number(digits || 0) / 100;
}
