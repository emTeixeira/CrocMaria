// Cliente: re-exporta tipos e expõe wrappers async para chamar server functions
// que persistem em Google Sheets.

export type { Entrega, Pagamento, Gasto, Categoria, Status } from "./sheets.functions";

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("amendoim:update"));
  }
}
