import { Button } from "@/components/ui/button";

type MonthFilterProps = {
  action?: string;
  month: string;
};

export function MonthFilter({ action, month }: MonthFilterProps) {
  return (
    <form action={action} className="month-filter">
      <label>
        <span>Mês/Ano</span>
        <input name="mes" type="month" defaultValue={month} />
      </label>
      <Button type="submit">Filtrar mês</Button>
    </form>
  );
}
