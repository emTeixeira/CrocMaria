import { createServerFn } from "@tanstack/react-start";
import { readAll, appendEntrega, confirmaPagamento, appendGasto, removeEntrega } from "./api";

export const TAB_ENTREGAS = "ENTREGAS";
export const TAB_PAGAMENTOS = "PAGAMENTOS";
export const TAB_GASTOS = "GASTOS";
export const SHEET_URL = "";

export type Status = "Pago" | "Parcial" | "Aberto" | "Cancelado";
export interface Entrega {
  id: string;
  data: string;
  vendedor: string;
  pacotes: number;
  valor: number;
  pago: number;
  falta: number;
  status: Status;
}
export interface Pagamento {
  data: string;
  idEntrega: string;
  valor: number;
}
export type Categoria = "Amendoim" | "Açúcar" | "Gás" | "Embalagem" | "Outros";
export interface Gasto {
  data: string;
  categoria: Categoria;
  valor: number;
  observacao?: string;
}

function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function parseEntregas(rows: unknown[][]): Entrega[] {
  return rows
    .map((r) => {
      const id = String(r[0] ?? "").trim();
      const data = String(r[1] ?? "").trim();
      const vendedor = String(r[2] ?? "").trim();
      const pacotes = num(r[3]);
      const valor = num(r[4]);
      const pago = num(r[5]);
      const falta = num(r[6]);
      const rawStatus = String(r[7] ?? "").trim();

      const status: Status =
        rawStatus === "Pago" ||
        rawStatus === "Parcial" ||
        rawStatus === "Aberto" ||
        rawStatus === "Cancelado"
          ? rawStatus
          : pago >= valor
            ? "Pago"
            : pago > 0
              ? "Parcial"
              : "Aberto";

      return { id, data, vendedor, pacotes, valor, pago, falta, status };
    })
    .filter((e) => e.id && e.vendedor);
}

function parsePagamentos(rows: unknown[][]): Pagamento[] {
  return rows
    .map((r) => ({
      data: String(r[0] ?? "").trim(),
      idEntrega: String(r[1] ?? "").trim(),
      valor: num(r[2]),
    }))
    .filter((p) => p.idEntrega && p.valor > 0);
}

function parseGastos(rows: unknown[][]): Gasto[] {
  return rows
    .map((r) => ({
      data: String(r[0] ?? "").trim(),
      categoria: String(r[1] ?? "Outros") as Categoria,
      valor: num(r[2]),
      observacao: r[3] ? String(r[3]) : undefined,
    }))
    .filter((g) => g.data);
}

function recomputeEntregas(entregas: Entrega[], pagamentos: Pagamento[]) {
  const pagamentosPorEntrega = new Map<string, number>();

  for (const p of pagamentos) {
    pagamentosPorEntrega.set(p.idEntrega, (pagamentosPorEntrega.get(p.idEntrega) ?? 0) + p.valor);
  }

  return entregas.map((e) => {
    if (e.status === "Cancelado") return e;

    const pago = pagamentosPorEntrega.get(e.id) ?? e.pago ?? 0;
    const falta = Math.max(0, e.valor - pago);
    const status: Status = falta <= 0.0001 ? "Pago" : pago > 0 ? "Parcial" : "Aberto";

    return {
      ...e,
      pago,
      falta,
      status,
    };
  });
}

export const fetchAll = createServerFn({ method: "GET" }).handler(async () => {
  const { entregas: eRows, pagamentos: pRows, gastos: gRows } = await readAll();

  const entregasBase = parseEntregas(eRows).reverse();
  const pagamentos = parsePagamentos(pRows).reverse();
  const gastos = parseGastos(gRows).reverse();

  const entregas = recomputeEntregas(entregasBase, pagamentos);

  return {
    entregas,
    pagamentos,
    gastos,
    sheetUrl: SHEET_URL,
  };
});

export const addEntregaFn = createServerFn({ method: "POST" })
  .inputValidator((d: { pacotes: number; vendedor: string }) => {
    if (!d || typeof d.pacotes !== "number" || d.pacotes <= 0) throw new Error("Pacotes inválido");
    if (!d.vendedor || typeof d.vendedor !== "string") throw new Error("Vendedor obrigatório");
    return { pacotes: Math.floor(d.pacotes), vendedor: d.vendedor.trim().slice(0, 80) };
  })
  .handler(async ({ data }) => {
    return appendEntrega(data.vendedor, data.pacotes);
  });

export const addPagamentoFn = createServerFn({ method: "POST" })
  .inputValidator((d: { idEntrega: string; valor: number }) => {
    if (!d?.idEntrega) throw new Error("idEntrega obrigatório");
    if (typeof d.valor !== "number" || d.valor <= 0) throw new Error("Valor inválido");
    return { idEntrega: d.idEntrega.trim(), valor: d.valor };
  })
  .handler(async ({ data }) => {
    return confirmaPagamento(data.idEntrega, data.valor);
  });

export const addGastoFn = createServerFn({ method: "POST" })
  .inputValidator((d: { categoria: Categoria; valor: number; observacao?: string }) => {
    if (!d?.categoria) throw new Error("Categoria obrigatória");
    if (typeof d.valor !== "number" || d.valor <= 0) throw new Error("Valor inválido");
    return {
      categoria: d.categoria,
      valor: d.valor,
      observacao: d.observacao?.slice(0, 200) ?? "",
    };
  })
  .handler(async ({ data }) => {
    return appendGasto(data.categoria, data.valor, data.observacao);
  });

export const deleteEntregaFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; vendedor: string }) => {
    if (!d?.id || typeof d.id !== "string") throw new Error("id obrigatório");
    if (!d?.vendedor || typeof d.vendedor !== "string") throw new Error("vendedor obrigatório");
    return { id: d.id.trim(), vendedor: d.vendedor.trim() };
  })
  .handler(async ({ data }) => {
    return removeEntrega(data.id, data.vendedor);
  });
