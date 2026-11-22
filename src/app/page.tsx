import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";

export default function Home() {
  return <div className="flex min-h-dvh flex-col bg-background">
    <AppHeader />
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
      <svg aria-hidden="true" viewBox="0 0 180 150" className="h-36 w-44 text-primary" fill="none">
        <path d="M32 15h75a12 12 0 0 1 12 12v61a12 12 0 0 1-12 12H70l-23 18v-18H32a12 12 0 0 1-12-12V27a12 12 0 0 1 12-12Z" fill="var(--primary-subtle)" stroke="currentColor" strokeWidth="3" />
        <path d="M45 43h49M45 59h38M45 75h29" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <rect x="95" y="54" width="62" height="78" rx="8" fill="white" stroke="currentColor" strokeWidth="3" />
        <path d="m109 91 10 10 22-25" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className="mt-8 break-keep text-3xl font-bold leading-tight sm:text-4xl">어려운 금융정보, 쉽고 정확하게 확인하세요.</h1>
      <p className="mt-5 break-keep text-lg text-foreground-muted">궁금한 금융정보를 질문하고 관련 공식 자료를 확인할 수 있어요.</p>
      <Link href="/financial-information" className="mt-8 inline-flex min-h-14 items-center justify-center rounded-control bg-primary px-8 py-3 text-lg font-bold text-primary-foreground">금융정보 질문하기</Link>
    </main>
    <footer className="px-5 pb-8 text-center text-foreground-muted">확인된 범위의 공식 자료를 찾아요.</footer>
  </div>;
}
