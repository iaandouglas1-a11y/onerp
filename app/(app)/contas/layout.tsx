"use client";

import React from "react";

export default function ContasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight px-1">
        Contas
      </h1>

      {children}
    </div>
  );
}
