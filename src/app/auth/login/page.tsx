import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { buildApiUrl } from "@/lib/api/config";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg px-4 pb-12 pt-10 sm:px-6">
        <section aria-labelledby="login-heading" className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-primary">일반 상담</p>
          <h1 id="login-heading" className="mt-3 break-keep text-3xl font-bold tracking-tight">상담을 계속하려면 로그인해 주세요</h1>
          <p className="mt-4 break-keep leading-7 text-foreground-muted">로그인하면 상담 결과를 저장하고, 나중에 이어서 확인할 수 있어요.</p>
          <div className="mt-8 space-y-3">
            <a href={buildApiUrl("/auth/kakao/start")} className="flex min-h-14 items-center justify-center rounded-control bg-[#FEE500] px-4 font-semibold text-[#191919] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">카카오로 로그인</a>
            <a href={buildApiUrl("/auth/naver/start")} className="flex min-h-14 items-center justify-center rounded-control bg-[#03C75A] px-4 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">네이버로 로그인</a>
          </div>
          <Link href="/emergency/type" className="mt-6 inline-flex min-h-11 w-full items-center justify-center text-center text-sm font-semibold text-foreground-muted underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">긴급 금융 피해 대응은 로그인 없이 이용하기</Link>
        </section>
      </main>
    </div>
  );
}
