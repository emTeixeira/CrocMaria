import { createFileRoute } from "@tanstack/react-router";
import logoPlaceholder from "@/assets/logo-placeholder.png";
import { useMemo, useState } from "react";
import { useStore } from "@/hooks/useStore";
import { AppShell } from "@/components/AppShell";
import { formatBRL, formatDate, type Entrega } from "@/lib/store";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Package, TrendingUp, Wallet, AlertCircle, Receipt, PiggyBank } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle do Amendoim Doce" },
      { name: "description", content: "Controle financeiro da produção de amendoim doce." },
    ],
  }),
  component: Dashboard,
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
  Cancelado: "",
};

function Dashboard() {
  const { entregas, pagamentos, gastos } = useStore();
  const [filtro, setFiltro] = useState<Filtro>("tudo");

  const ent = useMemo(() => entregas.filter((e) => inRange(e.data, filtro)), [entregas, filtro]);
  const pag = useMemo(
    () => pagamentos.filter((p) => inRange(p.data, filtro)),
    [pagamentos, filtro],
  );
  const gas = useMemo(() => gastos.filter((g) => inRange(g.data, filtro)), [gastos, filtro]);

  const totalPacotes = ent.reduce((s, e) => s + e.pacotes, 0);
  const receita = ent.reduce((s, e) => s + e.valor, 0);
  const recebido = ent.reduce((s, e) => s + e.pago, 0);
  const aberto = ent.reduce((s, e) => s + e.falta, 0);
  const custos = gas.reduce((s, g) => s + g.valor, 0);
  const lucro = recebido - custos;

  // gráfico entregas por dia
  const entPorDia = useMemo(() => {
    const map = new Map<string, number>();
    ent.forEach((e) => {
      const k = new Date(e.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(k, (map.get(k) || 0) + e.pacotes);
    });
    return Array.from(map.entries())
      .reverse()
      .map(([dia, pacotes]) => ({ dia, pacotes }));
  }, [ent]);

  const pagPorDia = useMemo(() => {
    const map = new Map<string, number>();
    pag.forEach((p) => {
      const k = new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map.set(k, (map.get(k) || 0) + p.valor);
    });
    return Array.from(map.entries())
      .reverse()
      .map(([dia, valor]) => ({ dia, valor }));
  }, [pag]);

  const gastosPorCat = useMemo(() => {
    const map = new Map<string, number>();
    gas.forEach((g) => map.set(g.categoria, (map.get(g.categoria) || 0) + g.valor));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [gas]);

  const PIE_COLORS = ["#16a34a", "#eab308", "#f97316", "#0ea5e9", "#a855f7"];

  return (
    <AppShell title="" logoSrc={logoPlaceholder}>
      {/* Filtros */}
      <div className="flex gap-2 mb-5 overflow-x-auto -mx-1 px-1">
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

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard tone="primary" Icon={Package} label="Pacotes" value={totalPacotes.toString()} />
        <StatCard tone="primary" Icon={TrendingUp} label="Receita" value={formatBRL(receita)} />
        <StatCard tone="success" Icon={Wallet} label="Recebido" value={formatBRL(recebido)} />
        <StatCard tone="danger" Icon={AlertCircle} label="Em aberto" value={formatBRL(aberto)} />
        <StatCard tone="warning" Icon={Receipt} label="Custos" value={formatBRL(custos)} />
        <StatCard
          tone={lucro >= 0 ? "success" : "danger"}
          Icon={PiggyBank}
          label="Lucro"
          value={formatBRL(lucro)}
        />
      </div>

      {/* Gráficos */}
      <ChartCard title="Entregas por dia">
        {entPorDia.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={entPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="dia" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip cursor={{ fill: "oklch(0.95 0.04 150)" }} />
              <Bar dataKey="pacotes" fill="oklch(0.62 0.17 152)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Pagamentos recebidos">
        {pagPorDia.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={pagPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="dia" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="oklch(0.62 0.17 152)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Gastos por categoria">
        {gastosPorCat.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gastosPorCat}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={75}
                paddingAngle={3}
              >
                {gastosPorCat.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Tabela */}
      <section className="bg-card rounded-2xl shadow-card border border-border overflow-hidden mb-4">
        <h2 className="text-base font-semibold px-5 pt-4 pb-2">Entregas recentes</h2>
        {ent.length === 0 ? (
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
                  <th className="text-right px-3 py-2">Falta</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ent.slice(0, 20).map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-3 py-3 font-medium">{e.id}</td>
                    <td className="px-3 py-3 text-muted-foreground">{formatDate(e.data)}</td>
                    <td className="px-3 py-3 text-right">{e.pacotes}</td>
                    <td className="px-3 py-3 text-right">{formatBRL(e.valor)}</td>
                    <td className="px-3 py-3 text-right">{formatBRL(e.falta)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[e.status]}`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Empty() {
  return <p className="text-center text-muted-foreground text-sm py-8">Sem dados ainda.</p>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-4 mb-4">
      <h2 className="text-sm font-semibold mb-2 text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "danger" | "warning";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
    warning: "bg-warning/25 text-warning-foreground",
  }[tone];
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-4">
      <div className={`inline-flex items-center justify-center size-9 rounded-xl mb-3 ${toneCls}`}>
        <Icon className="size-5" />
      </div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="text-lg font-bold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}
