"use client";

import { useState } from "react";
import { formatCurrencyFromNumber, formatCurrencyInput } from "@/utils/currency";

type CurrencyInputProps = {
  defaultValue?: number | string | null;
  name: string;
  placeholder?: string;
  required?: boolean;
};

export function CurrencyInput({ defaultValue, name, placeholder = "R$ 0,00", required = false }: CurrencyInputProps) {
  const [value, setValue] = useState(defaultValue ? formatCurrencyFromNumber(defaultValue) : "");

  return (
    <input
      inputMode="numeric"
      name={name}
      placeholder={placeholder}
      required={required}
      value={value}
      onChange={(event) => setValue(formatCurrencyInput(event.target.value))}
    />
  );
}
