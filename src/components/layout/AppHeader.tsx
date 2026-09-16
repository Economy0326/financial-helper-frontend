"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSessionQuery } from "@/lib/query/session";

type AppHeaderProps = {
  rightSlot?: ReactNode;
};

export function AppHeader({
  rightSlot,
}: AppHeaderProps) {
  const session = useSessionQuery();
  const authenticated =
    session.data?.authenticated === true;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-[72rem] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="min-w-0 rounded-md text-lg font-bold tracking-[-0.02em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          aria-label="금융도우미 홈으로 이동"
        >
          금융도우미
        </Link>

        <nav aria-label="주요 메뉴" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href={authenticated ? "/account" : "/auth/login"}
            className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {authenticated ? "상담 내역" : "로그인"}
          </Link>
          {rightSlot ? rightSlot : null}
        </nav>
      </div>
    </header>
  );
}
