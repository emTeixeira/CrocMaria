import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { formatBRL, notifyUpdate } from "@/lib/store";
import { addEntregaFn } from "@/lib/sheets.functions";
import { toast } from "sonner";
import { Check, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/nova-entrega")({
  head: () => ({ meta: [{ title: "Nova Entrega" }] }),
  component: NovaEntrega,
});

function NovaEntrega() {
  const [pacotes, setPacotes] = useState<number>(0);
  const [vendedor, setVendedor] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const valor = pacotes * 1;

  async function confirmar() {
    if (pacotes <= 0) return toast.error("Informe a quantidade de pacotes");
    if (!vendedor.trim()) return toast.error("Informe o nome do vendedor");
    setLoading(true);
    try {
      const e = await addEntregaFn({ data: { pacotes, vendedor: vendedor.trim() } });
      notifyUpdate();
      toast.success(`Entrega ${e.id} registrada!`);
      setPacotes(0);
      setVendedor("");
      setTimeout(() => navigate({ to: "/" }), 600);
    } catch (err) {
      toast.error((err as Error).message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Nova Entrega">
      <p className="text-muted-foreground mb-6">
        Quantos pacotes foram entregues hoje?
      </p>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6 mb-4">
        <label className="text-sm font-semibold text-muted-foreground">Vendedor</label>
        <input
          type="text"
          value={vendedor}
          onChange={e => setVendedor(e.target.value)}
          placeholder="Nome do vendedor"
          className="w-full mt-3 px-4 py-3 text-lg rounded-2xl bg-secondary text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-6 mb-6">
        <label className="text-sm font-semibold text-muted-foreground">Quantidade de pacotes</label>

        <div className="flex items-center justify-center gap-4 mt-4 mb-2">
          <button
            onClick={() => setPacotes(Math.max(0, pacotes - 1))}
            className="size-14 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition flex items-center justify-center"
            aria-label="Diminuir"
          ><Minus className="size-6"/></button>

          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={pacotes || ""}
            onChange={e => setPacotes(Math.max(0, parseInt(e.target.value || "0", 10)))}
            placeholder="0"
            className="w-32 text-center text-5xl font-bold tabular-nums bg-transparent outline-none focus:text-primary"
          />

          <button
            onClick={() => setPacotes(pacotes + 1)}
            className="size-14 rounded-full bg-secondary text-secondary-foreground active:scale-95 transition flex items-center justify-center"
            aria-label="Aumentar"
          ><Plus className="size-6"/></button>
        </div>

        <div className="text-center text-muted-foreground mt-4">
          Valor: <span className="font-bold text-foreground">{formatBRL(valor)}</span>
        </div>
      </div>

      <button
        onClick={confirmar}
        disabled={loading || pacotes <= 0 || !vendedor.trim()}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-bold shadow-soft active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? "Salvando..." : (<><Check className="size-6"/> CONFIRMAR ENTREGA</>)}
      </button>
    </AppShell>
  );
}
