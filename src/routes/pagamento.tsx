import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/hooks/useStore";
import { formatBRL, notifyUpdate } from "@/lib/store";
import { addPagamentoFn } from "@/lib/sheets.functions";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pagamento")({
  head: () => ({ meta: [{ title: "Registrar Pagamento" }] }),
  component: Pagamento,
});

function Pagamento() {
  const { entregas } = useStore();
  const abertas = useMemo(() => entregas.filter(e => e.status !== "Pago"), [entregas]);
  const [id, setId] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const selecionada = entregas.find(e => e.id === id);

  async function confirmar() {
    const v = parseFloat(valor.replace(",", "."));
    if (!id) return toast.error("Selecione uma entrega");
    if (!v || v <= 0) return toast.error("Informe um valor válido");
    setLoading(true);
    try {
      await addPagamentoFn({ data: { idEntrega: id, valor: v } });
      notifyUpdate();
      toast.success("Pagamento registrado!");
      setId(""); setValor("");
      setTimeout(() => navigate({ to: "/" }), 600);
    } catch (e) {
      toast.error((e as Error).message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Pagamento">
      <p className="text-muted-foreground mb-6">Registre o valor recebido.</p>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-5 mb-4 space-y-5">
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Entrega</label>
          {abertas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Nenhuma entrega em aberto.</p>
          ) : (
            <select
              value={id}
              onChange={e => setId(e.target.value)}
              className="mt-2 w-full bg-secondary rounded-xl px-4 py-4 text-base font-medium outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {abertas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.id} — falta {formatBRL(e.falta)}
                </option>
              ))}
            </select>
          )}
          {selecionada && (
            <div className="mt-3 text-sm text-muted-foreground">
              Total: <b className="text-foreground">{formatBRL(selecionada.valor)}</b> · Já pago:{" "}
              <b className="text-foreground">{formatBRL(selecionada.pago)}</b>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground">Valor pago (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={e => setValor(e.target.value.replace(/[^\d,.-]/g, ""))}
            placeholder="0,00"
            className="mt-2 w-full bg-secondary rounded-xl px-4 py-4 text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <button
        onClick={confirmar}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-bold shadow-soft active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "Salvando..." : (<><Check className="size-6"/> CONFIRMAR PAGAMENTO</>)}
      </button>
    </AppShell>
  );
}
