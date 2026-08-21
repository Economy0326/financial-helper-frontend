import Link from "next/link";
import type { ReactNode } from "react";

type AppHeaderProps = {
  rightSlot?: ReactNode;
};

export function AppHeader({
  rightSlot,
}: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-[72rem] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-md text-lg font-bold tracking-[-0.02em] text-foreground"
          aria-label="금융도우미 홈으로 이동"
        >
          금융도우미
        </Link>

        {rightSlot ? (
          <div className="flex items-center gap-2">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </header>
  );
}