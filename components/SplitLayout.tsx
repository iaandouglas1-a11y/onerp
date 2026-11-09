import { clsx } from "clsx";

/**
 * Layout responsivo dos módulos: no desktop as ações e formulários ficam no topo,
 * seguidos pelos indicadores e pelo conteúdo em largura total.
 *
 * No mobile a ordem original é preservada: top → aside → children. No desktop, o painel de ações aparece
 * antes dos indicadores e da lista, sem alterar o visual dos componentes internos.
 */
export function SplitLayout({
  top,
  aside,
  children,
  className,
}: {
  top?: React.ReactNode;
  aside: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "onfin-module-layout flex flex-col gap-4 md:gap-5 md:items-stretch",
        className
      )}
    >
      {top && <div className="onfin-module-summary order-1 min-w-0 space-y-4 md:order-2 md:space-y-5">{top}</div>}
      <aside className="onfin-module-actions order-2 space-y-3 md:order-1">
        {aside}
      </aside>
      <div className="onfin-module-content order-3 min-w-0 space-y-4 md:space-y-5">{children}</div>
    </div>
  );
}
