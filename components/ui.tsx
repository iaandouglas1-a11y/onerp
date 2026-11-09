import Link from "next/link";
import { clsx } from "clsx";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { currency } from "@/lib/format";

export function Card({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={clsx("glass-card p-6 md:p-8", className)}>
      {children}
    </div>
  );
}

export function MetricCard({ 
  title, 
  value, 
  tone = "default",
  icon: Icon,
  change,
  trend
}: { 
  title: string; 
  value: string; 
  tone?: "default" | "good" | "bad" | "white" | "amber";
  icon?: React.ReactNode;
  change?: string;
  trend?: "up" | "down";
}) {
  const tones = {
    good:    "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40",
    bad:     "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20 hover:border-rose-500/40",
    default: "from-[#5DA832]/20 to-[#5DA832]/5 text-[#5DA832] border-[#5DA832]/20 hover:border-[#5DA832]/40",
    white:   "from-slate-100/10 to-slate-100/5 text-white border-slate-100/20 hover:border-slate-100/40",
    amber:   "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 hover:border-amber-500/40",
  };

  return (
    <div className={clsx("metric-card border bg-gradient-to-br p-6 transition-all duration-300", tones[tone])}>
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-70 truncate">{title}</p>
          <p className="num mt-3 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight truncate">{value}</p>
          {change && (
            <p className={clsx("text-xs font-semibold mt-2", trend === "up" ? "text-emerald-400" : "text-rose-400")}>
              {trend === "up" ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="opacity-20 shrink-0 ml-3">
            {Icon}
          </div>
        )}
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-current opacity-5 blur-3xl" />
    </div>
  );
}

export function Button({ 
  children, 
  className, 
  variant = "primary",
  size = "md",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "text-slate-300 hover:text-white hover:bg-surface-2/50 transition-all duration-200 px-4 py-2 rounded-xl",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      {...props}
      className={clsx(
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "input-modern",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "select-modern",
        props.className
      )}
    />
  );
}

export function NavLink({ href, children, isActive = false }: { href: string; children: React.ReactNode; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-[#5DA832]/20 text-[#5DA832] border border-[#5DA832]/30"
          : "text-slate-400 hover:bg-surface-2/50 hover:text-slate-200 border border-transparent"
      )}
    >
      {children}
    </Link>
  );
}

export function Badge({ 
  children, 
  variant = "default", 
  className 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "error" | "warning" | "info"; 
  className?: string 
}) {
  const variants = {
    default: "badge-default",
    success: "badge-success",
    error: "badge-error",
    warning: "badge-warning",
    info: "badge-info",
  };

  return (
    <span className={clsx(variants[variant], className)}>
      {children}
    </span>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="spinner-modern"></div>
    </div>
  );
}

export function FormGroup({ 
  label, 
  error, 
  children,
  className,
}: { 
  label?: string; 
  error?: string; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {label && <label className="label-modern">{label}</label>}
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}

export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description?: string; 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight text-ink-primary">{title}</h1>
        {description && <p className="text-slate-400 mt-2 text-sm sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {Icon && (
        <div className="mb-4 w-14 h-14 rounded-[18px] bg-[#5DA832]/[0.14] text-[#8FCB5E] flex items-center justify-center [&>svg]:h-6 [&>svg]:w-6">
          {Icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-primary mb-1">{title}</h3>
      {description && <p className="text-ink-secondary text-sm mb-5 max-w-xs">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-surface-border/40" />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("bg-surface-2/60 rounded-xl animate-pulse", className)} />
  );
}

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-surface text-slate-200 text-xs px-3 py-1 rounded-xl whitespace-nowrap border border-surface-border/60 z-50">
        {text}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DESIGN SYSTEM 2.0 — Novos primitivos
   Ver DESIGN-SYSTEM.md para a proposta completa (tokens, princípios).
   ════════════════════════════════════════════════════════════════════ */

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  green:  { bg: "rgba(93,168,50,0.14)",   fg: "#8FCB5E" },
  red:    { bg: "rgba(248,113,113,0.14)", fg: "#F87171" },
  amber:  { bg: "rgba(245,165,36,0.14)",  fg: "#F5A524" },
  blue:   { bg: "rgba(96,165,250,0.14)",  fg: "#60A5FA" },
  purple: { bg: "rgba(192,132,252,0.14)", fg: "#C084FC" },
  brand:  { bg: "#202020", fg: "#6fc23b" },
  gray:   { bg: "rgba(255,255,255,0.08)", fg: "#94A3B8" },
};
export type IconTone = keyof typeof TONE_COLORS;

/** Chip de ícone circular colorido — usado em listas, grades e headers. */
export function IconChip({
  icon: Icon,
  tone = "gray",
  size = 40,
  iconSize = 18,
  rounded = "rounded-xl",
}: {
  icon: LucideIcon;
  tone?: IconTone;
  size?: number;
  iconSize?: number;
  rounded?: string;
}) {
  const c = TONE_COLORS[tone] ?? TONE_COLORS.gray;
  return (
    <div
      className={clsx("icon-chip", rounded)}
      style={{ width: size, height: size, background: c.bg, color: c.fg }}
    >
      <Icon size={iconSize} strokeWidth={2.1} />
    </div>
  );
}

/** Texto de valor monetário — tabular-nums, cor semântica opcional. */
export function AmountText({
  value,
  signed = false,
  tone,
  className,
  size = "md",
}: {
  value: number;
  signed?: boolean;
  tone?: "green" | "red" | "amber" | "neutral";
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
}) {
  const normalizedValue = Object.is(value, -0) || Math.abs(value) < 0.005 ? 0 : value;
  const resolvedTone = tone ?? (signed ? (normalizedValue >= 0 ? "green" : "red") : "neutral");
  const toneClass =
    resolvedTone === "green" ? "text-[#8FCB5E]" :
    resolvedTone === "red" ? "text-[#f87171]" :
    resolvedTone === "amber" ? "text-[#f5a524]" :
    "text-ink-primary";
  const sizeClass = {
    sm: "text-sm font-semibold",
    md: "text-[15px] font-semibold",
    lg: "text-2xl font-semibold",
    hero: "text-[38px] leading-tight font-semibold tracking-tight",
  }[size];
  const prefix = signed ? (normalizedValue >= 0 ? "+ " : "- ") : "";
  // Math.abs só se aplica quando `signed`, pois aí o sinal já é comunicado pelo
  // prefixo "+ "/"- " manual. Sem `signed`, o valor precisa manter o sinal real
  // (ex.: saldo de conta negativo) — Intl.NumberFormat já formata isso com "-".
  const displayValue = signed ? Math.abs(normalizedValue) : normalizedValue;
  return (
    <span className={clsx("num", sizeClass, toneClass, className)}>
      {prefix}{currency(displayValue)}
    </span>
  );
}

/** Superfície base — substitui "glass-card" para blocos sem hover-lift. */
export function Surface({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={clsx("surface-2 bg-surface", padded && "p-4", className)}>
      {children}
    </div>
  );
}

/** Container de lista — agrupa ListRow's com divisórias internas consistentes. */
export function ListGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("surface-2 overflow-hidden", className)}>{children}</div>;
}

/** Linha de lista tocável: ícone + título/subtítulo + valor + chevron opcional. */
export function ListRow({
  icon,
  tone = "gray",
  title,
  subtitle,
  value,
  valueTone,
  href,
  onClick,
  right,
  chevron = false,
  active = false,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  title: string;
  subtitle?: string;
  value?: string | React.ReactNode;
  valueTone?: "green" | "red" | "neutral";
  href?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  chevron?: boolean;
  active?: boolean;
}) {
  const content = (
    <div className="list-row">
      <IconChip icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-ink-primary truncate">{title}</div>
        {subtitle && <div className="text-[11.5px] text-ink-tertiary mt-0.5 truncate">{subtitle}</div>}
      </div>
      {typeof value === "string" ? (
        <span className={clsx(
          "num text-[14.5px] font-semibold shrink-0",
          valueTone === "green" && "text-[#8FCB5E]",
          valueTone === "red" && "text-[#f87171]",
          !valueTone && "text-ink-primary"
        )}>{value}</span>
      ) : value}
      {right}
      {chevron && <ChevronRight size={16} className="text-slate-600 shrink-0" />}
    </div>
  );

  if (href) {
    return <Link href={href} className={clsx("block hover:bg-surface-2/40 transition-colors", active && "md:bg-[#5DA832]/10")}>{content}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left hover:bg-surface-2/40 transition-colors">{content}</button>;
  }
  return content;
}

/** Pill de estatística — número + label, usado em grades de 2-4 colunas. */
export function StatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "green" | "red" | "amber" | "neutral";
}) {
  const toneClass =
    tone === "green" ? "text-[#8FCB5E]" :
    tone === "red" ? "text-[#f87171]" :
    tone === "amber" ? "text-[#f5a524]" :
    "text-ink-primary";
  return (
    <div className="surface-2 bg-surface px-3.5 py-3 flex-1 min-w-0">
      <div className="text-[11px] font-semibold text-ink-secondary truncate">{label}</div>
      <div className={clsx("num text-[15px] sm:text-lg font-semibold mt-1 leading-tight break-words", toneClass)}>{value}</div>
    </div>
  );
}

/** Controle segmentado (tabs de 2-3 opções, estilo iOS). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-surface border border-surface-border/60 rounded-xl p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex-1 text-center py-2 text-[12.5px] font-semibold rounded-xl transition-all duration-150",
            value === opt.value ? "bg-[#5DA832] text-[#0A0A0A]" : "text-ink-secondary hover:text-ink-primary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Barra de progresso simples — usada em dívidas, faturas (limite), metas. */
export function ProgressBar({ pct, color = "#5DA832" }: { pct: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-2">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}

/** Botão de ação circular — usado na grade de ações rápidas do dashboard. */
export function QuickAction({ icon: Icon, label, href, onClick }: { icon: LucideIcon; label: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-[52px] h-[52px] rounded-2xl bg-surface border border-surface-border/60 flex items-center justify-center text-ink-primary active:scale-95 active:bg-surface-2 transition-all">
        <Icon size={20} strokeWidth={2} />
      </div>
      <span className="text-[11px] font-semibold text-ink-secondary text-center">{label}</span>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="contents">{inner}</button>;
}

/** Logo de uma instituição (banco/cartão) via URL salva no banco — com fallback
 * para o IconChip genérico quando não há logo_url cadastrada. */
export function EntityLogo({
  src,
  icon,
  tone = "gray",
  size = 40,
  iconSize = 18,
  rounded = "rounded-xl",
}: {
  src?: string | null;
  icon: LucideIcon;
  tone?: IconTone;
  size?: number;
  iconSize?: number;
  rounded?: string;
}) {
  if (src) {
    return (
      <div className={clsx("overflow-hidden shrink-0 bg-surface-2 border border-surface-border/50", rounded)} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return <IconChip icon={icon} tone={tone} size={size} iconSize={iconSize} rounded={rounded} />;
}

/** Wrapper de bottom sheet simples (overlay controlado externamente). */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-surface border border-surface-border rounded-t-sheet shadow-sheet pb-[max(20px,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-9 h-1 rounded-full bg-surface-border" />
        </div>
        {title && <h4 className="px-5 pb-3 text-[15px] font-semibold text-ink-primary">{title}</h4>}
        <div className="px-5 pb-2">{children}</div>
      </div>
    </div>
  );
}
