"use client";

import { useEffect, useState } from "react";

/** true a partir do breakpoint `md` (768px). No servidor/1º render é false —
 * o mobile continua exatamente como antes (painéis fechados por padrão). */
export function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}
