"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import HomeActionCard from "@/components/home/HomeActionCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 md:pt-8 lg:px-8">
        <section className="rounded-card border border-border bg-surface-subtle p-6 sm:p-8 md:p-10">
          <p className="text-sm font-semibold text-primary">
            금융소비자 보호 AI
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            안녕하세요!
          </h1>

          <p className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
            금융 피해 상황을 쉽게 정리하고 다음 행동을 확인하세요.
          </p>

          <p className="mt-5 flex items-center gap-2 text-sm text-foreground-muted sm:text-base">
            <span aria-hidden="true" className="text-primary">
              ✓
            </span>
            개인정보와 상담 내용은 안전하게 보호됩니다.
          </p>
        </section>

        <section
          aria-label="상담 시작"
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <HomeActionCard
            href="/consultation/entry"
            title="금융 피해 상담하기"
            description="카드 피해, 의심 송금, 무단이체, 개인정보 노출을 함께 정리해요."
            ctaLabel="상담 시작하기"
            tone="primary"
            icon="consultation"
          />

          <HomeActionCard
            href="/emergency/type"
            title="긴급 금융 피해 대응"
            description="보이스피싱, 금융사기 등 긴급 상황에 즉시 대응해요."
            ctaLabel="지금 바로 시작하기"
            tone="danger"
            icon="emergency"
          />
        </section>

        <section
          aria-label="서비스 안내"
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <article className="rounded-card border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-bold text-foreground">믿고 이용하세요</h2>

            <p className="mt-2 leading-7 text-foreground-muted">
              검토된 공식 자료와 절차를 바탕으로 안내하며, 근거가 부족하면
              확인 가능한 범위만 보여드립니다.
            </p>
          </article>

          <article className="rounded-card border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-bold text-foreground">보안 안내</h2>

            <p className="mt-2 leading-7 text-foreground-muted">
              상담 내용은 안전하게 처리하며 민감한 개인정보 입력은
              최소화합니다.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
