import { Link, useLocation } from "@tanstack/react-router";
import { Home, PackagePlus, Wallet, Receipt, UserCircle2 } from "lucide-react";

const items = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/nova-entrega", label: "Entrega", Icon: PackagePlus },
  { to: "/pagamento", label: "Pagar", Icon: Wallet },
  { to: "/gasto", label: "Gasto", Icon: Receipt },
  { to: "/vendedor", label: "Vendedor", Icon: UserCircle2 },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ to, label, Icon }) => {
          const active = loc.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`size-6 ${active ? "stroke-[2.5]" : ""}`} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
