import type { ReactNode } from "react";

export function ReviewField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:gap-4"><strong className="font-semibold">{label}</strong><div className="min-w-0 break-words font-normal">{children}</div></div>;
}
