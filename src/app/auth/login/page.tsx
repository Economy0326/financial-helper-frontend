import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { buildApiUrl } from "@/lib/api/config";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg px-4 pb-12 pt-10 sm:px-6">
        <section className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          <p className="text-sm font-semibold text-primary">일반 상담</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">로그인하고 상담을 이어가세요</h1>
          <p className="mt-4 leading-7 text-foreground-muted">상담과 결과를 안전하게 보관하려면 카카오 또는 네이버 로그인이 필요해요.</p>
          <div className="mt-8 space-y-3">
            <a href={buildApiUrl("/auth/kakao/start")} className="flex min-h-12 items-center justify-center rounded-control bg-[#FEE500] px-4 font-semibold text-[#191919]">카카오로 로그인</a>
            <a href={buildApiUrl("/auth/naver/start")} className="flex min-h-12 items-center justify-center rounded-control bg-[#03C75A] px-4 font-semibold text-white">네이버로 로그인</a>
          </div>
          <Link href="/emergency/type" className="mt-6 block text-center text-sm font-semibold text-foreground-muted underline">긴급 금융 피해 대응은 로그인 없이 이용하기</Link>
        </section>
      </main>
    </div>
  );
}
