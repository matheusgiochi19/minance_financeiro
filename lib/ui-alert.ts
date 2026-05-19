export type UiAlertType = "success" | "error" | "warning";

export const uiAlertLabels: Record<UiAlertType, string> = {
  error: "Erro",
  success: "Sucesso",
  warning: "Aviso"
};

export function withUiAlert(path: string, type: UiAlertType, message: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("alertType", type);
  params.set("alert", message);
  return `${pathname}?${params.toString()}`;
}
