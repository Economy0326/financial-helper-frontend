import { AppHeader } from "@/components/layout/AppHeader";
import HomeActionCard from "@/components/home/HomeActionCard";
import HomeResumeSection, {
  type HomeResumeState,
} from "@/components/home/HomeResumeSection";

const resumeFixture: HomeResumeState = {
  status: "active",
  consultation: {
    title: "보험 해지환급금 상담",
    stepLabel: "내용 확인 단계 (4/6)",
    updatedAtLabel: "오늘 오후 3:20",
    href: "/consultation/summary",
  },
};

// 다른 Home State 확인 시 위 Fixture를 아래처럼 바꿔볼 수 있다.
// const resumeFixture: HomeResumeState = { status: "none" };
// const resumeFixture: HomeResumeState = { status: "loading" };
// const resumeFixture: HomeResumeState = { status: "error" };

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
            금융 문제를 쉽고 안전하게 해결하세요.
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
            href="/consultation/problem-category"
            title="금융 문제 해결하기"
            description="보험, 대출, 카드, 계좌 등 궁금한 금융 문제를 해결해요."
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

        <div className="mt-5">
          <HomeResumeSection state={resumeFixture} />
        </div>

        <section
          aria-label="서비스 안내"
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <article className="rounded-card border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-bold text-foreground">믿고 이용하세요</h2>

            <p className="mt-2 leading-7 text-foreground-muted">
              공식 금융기관 자료를 기반으로 분석하며, 근거가 부족할 경우
              신중하게 안내합니다.
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