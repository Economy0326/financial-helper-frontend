"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { logout } from "@/lib/api/auth";
import { apiFetch, resetClientAuthState } from "@/lib/api/client";
import { useSessionQuery } from "@/lib/query/session";

type AppHeaderProps = { rightSlot?: ReactNode; logoOnly?: boolean; confirmLeave?: boolean };

export function AppHeader({ rightSlot, logoOnly = false, confirmLeave = false }: AppHeaderProps) {
  const session = useSessionQuery();
  const queryClient = useQueryClient();
  const router = useRouter();
  const reviewer = useQuery({
    queryKey: ["reviewer-access", session.data?.accountId],
    queryFn: () => apiFetch<unknown[]>("/source-review/document-claims", { cache: "no-store" }),
    enabled: !logoOnly && session.data?.authenticated === true,
    retry: false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function handleLogout() {
    if (pending) return;
    setPending(true); setError("");
    try { await logout(); resetClientAuthState(); queryClient.clear(); router.replace("/"); }
    catch { setError("로그아웃하지 못했어요. 다시 시도해 주세요."); }
    finally { setPending(false); }
  }
  return <header className="bg-background">
    <div className="mx-auto flex w-full max-w-[72rem] flex-col items-center gap-3 px-4 py-5 sm:px-8">
      <div className="relative flex w-full justify-center"><Link href="/" onClick={event => { if (confirmLeave && !window.confirm("진행 중인 질문을 종료할까요?")) event.preventDefault(); }}
        className="rounded-md text-xl font-extrabold tracking-tight" aria-label="금융도우미 메인으로 이동"><span className="text-primary">금융</span>도우미</Link>
        {!logoOnly && reviewer.isSuccess && <Link className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground sm:hidden" href="/official-source-review/documents">공식문서 관리</Link>}</div>
      {!logoOnly && <nav aria-label="주요 메뉴" className="flex flex-nowrap items-center justify-center gap-x-2 whitespace-nowrap text-[13px] font-bold text-black sm:gap-x-6 sm:text-base">
        <Link className="inline-flex min-h-11 items-center px-1" href="/">메인으로</Link>
        <Link className="inline-flex min-h-11 items-center px-1" href="/faq">자주 묻는 질문</Link>
        <Link className="inline-flex min-h-11 items-center px-1" href="/reports">상담 기록</Link>
        {reviewer.isSuccess && <Link className="hidden min-h-11 items-center px-1 sm:inline-flex" href="/official-source-review/documents">공식문서 관리</Link>}
        {session.data?.authenticated ? <button type="button" disabled={pending} onClick={() => void handleLogout()}>{pending ? "로그아웃 중" : "로그아웃"}</button>
          : <Link className="inline-flex min-h-11 items-center px-1" href="/auth/login">로그인</Link>}
        {rightSlot}
      </nav>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  </header>;
}
