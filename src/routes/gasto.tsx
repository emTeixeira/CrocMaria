import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { notifyUpdate, type Categoria } from "@/lib/store";
import { addGastoFn } from "@/lib/sheets.functions";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/gasto")({
  head: () => ({ meta: [{ title: "Adicionar Gasto" }] }),
  component: Gasto,
});

const CATEGORIAS: Categoria[] = ["Amendoim", "Açúcar", "Gás", "Embalagem", "Outros"];

function Gasto() {
  const [cat, setCat] = useState<Categoria>("Amendoim");
  const [valor, setValor] = useState("");
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function salvar() {
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0) return toast.error("Informe um valor válido");
    setLoading(true);
    try {
      await addGastoFn({ data: { categoria: cat, valor: v, observacao: obs || undefined } });
      notifyUpdate();
      toast.success("Gasto salvo!");
      setValor(""); setObs("");
      setTimeout(() => navigate({ to: "/" }), 600);
    } catch (err) {
      toast.error((err as Error).message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Novo Gasto">
      <p className="text-muted-foreground mb-6">Registre uma despesa da produção.</p>

      <div className="bg-card rounded-3xl shadow-soft border border-border p-5 mb-4 space-y-5">
        <div>
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`py-3 rounded-xl text-sm font-semibold transition ${
                  cat === c
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={e => setValor(e.target.value.replace(/[^\d,.-]/g, ""))}
            placeholder="0,00"
            className="mt-2 w-full bg-secondary rounded-xl px-4 py-4 text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-muted-foreground">Observação (opcional)</label>
          <input
            type="text"
            value={obs}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex.: 5 kg na feira"
            className="mt-2 w-full bg-secondary rounded-xl px-4 py-4 text-base outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-bold shadow-soft active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? "Salvando..." : (<><Check className="size-6"/> SALVAR GASTO</>)}
      </button>
    </AppShell>
  );
}
