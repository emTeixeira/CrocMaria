import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { AppShell } from "@/components/AppShell";
import { formatBRL, formatDate, notifyUpdate, type Entrega } from "@/lib/store";
import { getVendedores } from "@/hooks/useStore";
import { deleteEntregaFn } from "@/lib/sheets.functions";
import { Package, Wallet, AlertCircle, UserCircle2, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/vendedor")({
  head: () => ({ meta: [{ title: "Painel do Vendedor" }] }),
  component: PainelVendedor,
});

type Filtro = "hoje" | "semana" | "mes" | "tudo";

function parseDate(iso: string): Date {
  // Suporta dd/mm/yyyy e yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) {
    const [d, m, y] = iso.split("/");
    return new Date(`${y}-${m}-${d}`);
  }
  return new Date(iso);
}

function inRange(iso: string, f: Filtro): boolean {
  if (f === "tudo") return true;
  const d = parseDate(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 86400000;
  if (f === "hoje") return d.toDateString() === now.toDateString();
  if (f === "semana") return diff <= 7;
  if (f === "mes") return diff <= 31;
  return true;
}

const STATUS_CLASS: Record<Entrega["status"], string> = {
  Pago: "bg-success/15 text-success",
  Parcial: "bg-warning/25 text-warning-foreground",
  Aberto: "bg-danger/15 text-danger",
  Cancelado: "bg-muted/15 text-muted-foreground",
};

const STORAGE_KEY = "amendoim:vendedor-logado";

function PainelVendedor() {
  const { entregas, loading: storeLoading } = useStore();
  const vendedores = getVendedores(entregas);
  const [vendedor, setVendedor] = useState<string>("");
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const [confirmar, setConfirmar] = useState<Entrega | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    if (!confirmar) return;
    setExcluindo(true);
    try {
      await deleteEntregaFn({ data: { id: confirmar.id, vendedor } });
      toast.success(`Entrega ${confirmar.id} excluída.`);
      setConfirmar(null);
      notifyUpdate();
    } catch (e) {
      toast.error((e as Error).message || "Erro ao excluir.");
    } finally {
      setExcluindo(false);
    }
  }

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setVendedor(saved);
  }, []);

  const loading = storeLoading;

  function escolher(v: string) {
    setVendedor(v);
    localStorage.setItem(STORAGE_KEY, v);
  }
  function sair() {
    setVendedor("");
    localStorage.removeItem(STORAGE_KEY);
  }

  if (loading) {
    return (
      <AppShell title="Painel do Vendedor">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-8 animate-spin mb-3" />
          Carregando...
        </div>
      </AppShell>
    );
  }

  if (!vendedor) {
    return (
      <AppShell title="Painel do Vendedor">
        <p className="text-muted-foreground mb-6">Selecione seu nome para ver suas entregas.</p>
        {vendedores.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground">
            Nenhum vendedor cadastrado ainda.
          </div>
        ) : (
          <div className="grid gap-3">
            {vendedores.map((v) => (
              <button
                key={v}
                onClick={() => escolher(v)}
                className="flex items-center gap-3 bg-card border border-border rounded-2xl p-5 shadow-card active:scale-[0.98] transition text-left"
              >
                <span className="inline-flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary">
                  <UserCircle2 className="size-6" />
                </span>
                <span className="text-lg font-semibold">{v}</span>
              </button>
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  const minhasEntregas = entregas.filter((e) => e.vendedor === vendedor);
  const filtradas = minhasEntregas.filter((e) => inRange(e.data, filtro));

  const totalPacotes = minhasEntregas.reduce((s, e) => s + e.pacotes, 0);
  const recebido = minhasEntregas.reduce((s, e) => s + e.pago, 0);
  const aberto = minhasEntregas.reduce((s, e) => s + e.falta, 0);

  return (
    <AppShell title="Painel do Vendedor">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary">
            <UserCircle2 className="size-6" />
          </span>
          <div>
            <div className="text-xs text-muted-foreground">Vendedor</div>
            <div className="text-lg font-bold leading-tight">{vendedor}</div>
          </div>
        </div>
        <button
          onClick={sair}
          className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          Trocar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6">
        <BigCard
          tone="primary"
          Icon={Package}
          label="Pacotes recebidos"
          value={totalPacotes.toString()}
        />
        <BigCard tone="success" Icon={Wallet} label="Valor recebido" value={formatBRL(recebido)} />
        <BigCard
          tone="danger"
          Icon={AlertCircle}
          label="Valor em aberto"
          value={formatBRL(aberto)}
        />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto -mx-1 px-1">
        {(
          [
            ["hoje", "Hoje"],
            ["semana", "Semana"],
            ["mes", "Mês"],
            ["tudo", "Tudo"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFiltro(k)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
              filtro === k
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <section className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        <h2 className="text-base font-semibold px-5 pt-4 pb-2">Minhas entregas</h2>
        {filtradas.length === 0 ? (
          <p className="px-5 py-8 text-center text-muted-foreground text-sm">
            Nenhuma entrega no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2">ID</th>
                  <th className="text-left px-3 py-2">Data</th>
                  <th className="text-right px-3 py-2">Pac.</th>
                  <th className="text-right px-3 py-2">Valor</th>
                  <th className="text-right px-3 py-2">Pago</th>
                  <th className="text-right px-3 py-2">Falta</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e) => (
                  <tr key={e.id} className="border-t border-border animate-in fade-in duration-300">
                    <td className="px-3 py-3 font-medium">{e.id}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(e.data)}</td>
                    <td className="px-3 py-3 text-right">{e.pacotes}</td>
                    <td className="px-3 py-3 text-right">{formatBRL(e.valor)}</td>
                    <td className="px-3 py-3 text-right">{formatBRL(e.pago)}</td>
                    <td className="px-3 py-3 text-right">{formatBRL(e.falta)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={() => setConfirmar(e)}
                        aria-label={`Excluir entrega ${e.id}`}
                        className="inline-flex items-center justify-center size-9 rounded-xl text-danger hover:bg-danger/10 transition active:scale-95"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AlertDialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar && (
                <>
                  A entrega <strong>{confirmar.id}</strong> de{" "}
                  <strong>{confirmar.pacotes} pacote(s)</strong> ({formatBRL(confirmar.valor)})
                  removida permanentemente da planilha, junto com os pagamentos vinculados. Esta
                  vinculados. Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => {
                ev.preventDefault();
                excluir();
              }}
              disabled={excluindo}
              className="bg-danger text-white hover:bg-danger/90"
            >
              {excluindo ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function BigCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "danger";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
  }[tone];
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-5 flex items-center gap-4 transition-all duration-300">
      <div className={`inline-flex items-center justify-center size-14 rounded-2xl ${toneCls}`}>
        <Icon className="size-7" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        <div className="text-2xl font-bold mt-0.5 tabular-nums">
          {useMemo(() => value, [value])}
        </div>
      </div>
    </div>
  );
}
