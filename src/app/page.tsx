"use client";

import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-col px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-12 sm:px-8 sm:pt-16">
        <section aria-labelledby="home-heading">
          <h1
            id="home-heading"
            className="break-keep text-[1.9375rem] font-bold leading-[1.28] tracking-[-0.03em] text-foreground sm:text-[2.5rem]"
          >
            금융 피해 상황을 정리하고<br className="hidden min-[360px]:block" />
            다음 행동을 확인하세요
          </h1>

          <p className="mt-4 break-keep text-[1.0625rem] font-medium leading-[1.65] text-foreground-muted sm:text-lg">
            몇 가지 질문으로 필요한 절차를<br className="hidden min-[360px]:block" />
            차근차근 안내해 드려요.
          </p>

          <Link
            href="/consultation/entry"
            className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-control bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-[0_6px_16px_rgb(8_127_115_/_0.16)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-3 motion-reduce:transition-none sm:w-auto sm:min-w-64"
          >
            금융 피해 상담하기
          </Link>
        </section>

        <section aria-label="지원하는 금융 피해" className="mt-7">
          <p className="break-keep text-base font-medium leading-7 text-foreground-muted">
            카드 피해 · 의심 송금 · 무단이체 · 스미싱
          </p>
        </section>

        <section aria-label="긴급 피해 대응" className="mt-9">
          <Link
            href="/emergency/type"
            className="group flex min-h-18 items-center gap-3 rounded-control border border-border bg-surface px-4 py-3.5 transition-colors hover:border-danger hover:bg-danger-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-3 motion-reduce:transition-none"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-danger" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 3 20 6v5c0 5.1-3.1 8.5-8 11-4.9-2.5-8-5.9-8-11V6l8-3Z" />
                <path d="M12 8v5" strokeLinecap="round" />
                <path d="M12 17h.01" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[1.0625rem] text-foreground">긴급 피해 대응</strong>
              <span className="block break-keep text-base leading-6 text-foreground-muted">
                지금 바로 확인해야 할 행동
              </span>
            </span>
            <span aria-hidden="true" className="text-2xl font-medium text-foreground-muted">›</span>
          </Link>
        </section>

        <section aria-label="서비스 신뢰 안내" className="mt-8">
          <p className="flex gap-3 text-base font-medium leading-7 text-foreground">
            <span aria-hidden="true" className="font-bold text-primary">✓</span>
            <span>검토된 공식 자료를 바탕으로 안내해요.</span>
          </p>
          <p className="mt-2 pl-7 text-[0.9375rem] leading-6 text-foreground-muted">
            상담에 필요한 정보만 사용해요.
          </p>
        </section>
      </main>
    </div>
  );
}
