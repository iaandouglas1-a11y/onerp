"use client";

import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export default function NotasShell({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const emNota = pathname !== "/notas";

  return (
    <div className="md:grid md:grid-cols-[minmax(290px,34%)_minmax(0,1fr)] md:gap-4 xl:gap-5 md:items-start">
      {/* Lista: no mobile some quando uma nota está aberta; no desktop fica sempre visível e fixa */}
      <div
        className={clsx(
          "space-y-6 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto md:pr-1",
          emNota && "hidden md:block"
        )}
      >
        {list}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
