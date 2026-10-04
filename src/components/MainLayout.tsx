"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname === "/" || pathname === "/auth";

  if (isFullBleed) {
    return <>{children}</>;
  }

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-4 pt-4 pb-28 sm:py-8 sm:px-6">
      {children}
    </main>
  );
}
