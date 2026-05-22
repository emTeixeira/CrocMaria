// src/lib/api.ts
const WEBHOOK = import.meta.env.VITE_WEBHOOK_URL as string;

type SheetCell = string | number | boolean | null;
type SheetRows = SheetCell[][];

async function post(body: object): Promise<unknown> {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`Erro [${res.status}]`);
  }

  if (json && typeof json === "object" && "ok" in json && (json as any).ok === false) {
    throw new Error(String((json as any).error || "Erro desconhecido"));
  }

  return json;
}

export async function readAll(): Promise<{
  entregas: SheetRows;
  pagamentos: SheetRows;
  gastos: SheetRows;
}> {
  const res = await fetch(WEBHOOK, {
    method: "GET",
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Erro ao buscar dados [${res.status}]`);
  }

  const json = await res.json().catch(() => null);

  if (!json || typeof json !== "object") {
    throw new Error("Resposta inválida da API");
  }

  return {
    entregas: Array.isArray((json as any).entregas) ? (json as any).entregas : [],
    pagamentos: Array.isArray((json as any).pagamentos) ? (json as any).pagamentos : [],
    gastos: Array.isArray((json as any).gastos) ? (json as any).gastos : [],
  };
}

export async function appendEntrega(vendedor: string, pacotes: number) {
  return post({ action: "addEntrega", vendedor, pacotes });
}

export async function confirmaPagamento(idEntrega: string, valor: number) {
  return post({ action: "addPagamento", idEntrega, valor });
}

export async function appendGasto(categoria: string, valor: number, observacao?: string) {
  return post({ action: "addGasto", categoria, valor, observacao: observacao ?? "" });
}

export async function removeEntrega(id: string, vendedor: string) {
  return post({ action: "deleteEntrega", id, vendedor });
}
