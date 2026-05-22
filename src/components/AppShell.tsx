import { BottomNav } from "./BottomNav";

export function AppShell({
  title,
  logoSrc,
  children,
}: {
  title: string;
  logoSrc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-md px-5 py-1 flex items-center gap-3 overflow-hidden">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={title}
              width={180}
              height={180}
              className="h-40 w-40 object-contain -my-6"
            />
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 pt-4 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}
