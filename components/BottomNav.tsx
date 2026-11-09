"use client";

import type { LucideIcon } from "lucide-react";
import { House, List, Wallet, TrendingUp, Tags } from "lucide-react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import Link from "next/link";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Barra inferior fixa (mobile). Os demais módulos (Dívidas, Faturas, Notas e
// Gestão PJ) são abertos por atalhos no Dashboard.
const navItems: BottomNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/movimentacoes", label: "Extrato", icon: List },
  { href: "/contas", label: "Bancos", icon: Wallet },
  { href: "/investimentos", label: "Investim.", icon: TrendingUp },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

function NavItem({ item, isActive }: { item: BottomNavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="w-[62px] shrink-0 flex flex-col items-center gap-1 active:opacity-70 transition-opacity">
      <span
        className={clsx(
          "flex items-center justify-center w-[56px] h-[36px] rounded-[15px] transition-colors duration-200",
          isActive ? "bg-[#5DA832] text-[#0A0A0A]" : "text-ink-secondary"
        )}
      >
        <Icon className="w-7 h-7" strokeWidth={2.1} />
      </span>
      <span className={clsx("text-[10px] font-semibold leading-tight truncate max-w-[62px]", isActive ? "text-[#6fc23b]" : "text-ink-secondary")}>
        {item.label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className="md:hidden fixed z-50 inset-x-0 bottom-0 bg-[#0F0F0F] border-t border-surface-border/60 pt-0 pb-[max(7px,env(safe-area-inset-bottom,0px))]">
      <div className="max-w-md mx-auto flex items-start justify-around px-1">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} isActive={isActive(item.href)} />
        ))}
      </div>
    </nav>
  );
}

export { navItems };
