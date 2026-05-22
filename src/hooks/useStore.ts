import { useCallback, useEffect, useState } from "react";
import { fetchAll, type Entrega, type Pagamento, type Gasto } from "@/lib/sheets.functions";

interface State {
  entregas: Entrega[];
  pagamentos: Pagamento[];
  gastos: Gasto[];
  sheetUrl: string;
  loading: boolean;
  error: string | null;
}

const initial: State = {
  entregas: [],
  pagamentos: [],
  gastos: [],
  sheetUrl: "",
  loading: true,
  error: null,
};

export function useStore() {
  const [state, setState] = useState<State>(initial);

  const reload = useCallback(async () => {
    try {
      const data = await fetchAll();
      setState({
        entregas: data.entregas,
        pagamentos: data.pagamentos,
        gastos: data.gastos,
        sheetUrl: data.sheetUrl,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    reload();
    const h = () => reload();
    window.addEventListener("amendoim:update", h);
    return () => window.removeEventListener("amendoim:update", h);
  }, [reload]);

  return { ...state, reload };
}

export function getVendedores(entregas: Entrega[]): string[] {
  const set = new Set<string>();
  entregas.forEach(e => e.vendedor && set.add(e.vendedor));
  return Array.from(set).sort();
}
