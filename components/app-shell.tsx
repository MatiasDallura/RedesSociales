"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FileUp,
  Home,
  LogOut,
  PlusCircle,
  Settings,
  ShieldCheck,
  Target,
  Users,
  WalletCards
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/accounts", label: "Cuentas", icon: WalletCards },
  { href: "/campaigns", label: "Campañas", icon: Target },
  { href: "/campaigns/new", label: "Crear campaña", icon: PlusCircle },
  { href: "/leads", label: "CRM leads", icon: Users },
  { href: "/import", label: "Importar CSV", icon: FileUp },
  { href: "/safety", label: "Safety", icon: ShieldCheck },
  { href: "/settings", label: "Configuración", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-panel">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white md:block">
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-ink">Social Prospecting AI</p>
            <p className="text-xs text-slate-500">Private workspace</p>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-ink",
                  active && "bg-brand-50 text-brand-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur md:px-7">
          <div className="md:hidden">
            <p className="text-sm font-semibold text-ink">Social Prospecting AI</p>
            <p className="text-xs text-slate-500">Private workspace</p>
          </div>
          <div className="hidden text-sm text-slate-500 md:block">Descubrimiento, ranking y revisión manual de perfiles.</div>
          <button
            type="button"
            onClick={signOut}
            className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600",
                pathname === item.href && "bg-brand-50 text-brand-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
