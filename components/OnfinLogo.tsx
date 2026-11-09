import { clsx } from "clsx";

/** Logo Onfin — vetorial (sem depender de fonte). o = anel de progresso, n = verde, fin = texto.
 *  `fg` é a cor do "fin"; `track` é a cor da trilha do anel. */
type Props = {
  variant?: "mark" | "horizontal" | "stacked";
  className?: string;
  fg?: string;
  track?: string;
  title?: string;
};

export function OnfinLogo({ variant = "horizontal", className, fg = "#F5F7FA", track = "#2A2A2A", title = "Onfin" }: Props) {
  const viewBox =
    variant === "mark" ? "-42.5 -34 80 40" : variant === "stacked" ? "-45 -36 85 82" : "-22 -34 170 54";
  return (
    <svg viewBox={viewBox} role="img" aria-label={title} className={clsx("shrink-0", className)} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={6}>
        {variant === "horizontal" && (
          <><circle cx="0" cy="0" r="13" stroke={track}/><path d="M0 -13 A13 13 0 1 1 -13 0" stroke="#5DA832"/><path d="M26 13 L26 -2 A11 11 0 0 1 48 -2 L48 13" stroke="#5DA832"/><path d="M66.0 13.0 L66.0 -16.25 A9.75 9.75 0 0 1 75.75 -26.0" stroke={fg}/><path d="M56.25 -9.75 L75.75 -9.75" stroke={fg}/><path d="M92.0 13.0 L92.0 -9.75" stroke={fg}/><path d="M111.5 13.0 L111.5 0.0 A13.0 13.0 0 0 1 137.5 0.0 L137.5 13.0" stroke={fg}/><circle cx="92.0" cy="-26.0" r="5.69" fill={fg} stroke="none"/></>
        )}
        {variant === "stacked" && (
          <><circle cx="-20" cy="-14" r="13" stroke={track}/><path d="M-20 -27 A13 13 0 1 1 -33 -14" stroke="#5DA832"/><path d="M6 -1 L6 -16 A11 11 0 0 1 28 -16 L28 -1" stroke="#5DA832"/><path d="M-21.5 36 L-21.5 18 A6 6 0 0 1 -15.5 12" stroke={fg}/><path d="M-27.5 22 L-15.5 22" stroke={fg}/><path d="M-5.5 36 L-5.5 22" stroke={fg}/><path d="M6.5 36 L6.5 28 A8 8 0 0 1 22.5 28 L22.5 36" stroke={fg}/><circle cx="-5.5" cy="12" r="3.5" fill={fg} stroke="none"/></>
        )}
        {variant === "mark" && (
          <><circle cx="-20" cy="-14" r="13" stroke={track}/><path d="M-20 -27 A13 13 0 1 1 -33 -14" stroke="#5DA832"/><path d="M6 -1 L6 -16 A11 11 0 0 1 28 -16 L28 -1" stroke="#5DA832"/></>
        )}
      </g>
    </svg>
  );
}

/** Ícone de app (tile escuro com anel + n) — para cabeçalhos compactos. */
export function OnfinTile({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={clsx("inline-flex items-center justify-center rounded-[10px] bg-[#0A0A0A] border border-surface-border/70 shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <OnfinLogo variant="mark" className="w-[72%]" />
    </span>
  );
}
