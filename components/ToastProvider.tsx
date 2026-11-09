"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      expand={false}
      closeButton
      theme="light"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    />
  );
}
