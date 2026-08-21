export default function HomePage() {
  return (
    <main className="min-h-dvh px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[44rem]">
        <p className="text-sm font-semibold text-primary">
          금융도우미
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          금융 문제 해결을 더 쉽게
        </h1>

        <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
          Design Reference 기반 Frontend 구현을 위한 기본
          디자인 환경을 준비하고 있습니다.
        </p>

        <section className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold text-primary">
            Roadmap 7
          </p>

          <p className="mt-2 leading-7">
            Design Token, Global Style, Root Layout이
            정상적으로 적용되었습니다.
          </p>
        </section>
      </div>
    </main>
  );
}