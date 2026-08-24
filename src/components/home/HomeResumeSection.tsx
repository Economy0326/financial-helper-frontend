import Link from "next/link";

// 진행 중 Consultation 상태관련
// Resume Error가 새로운 상담 시작을 막으면 안됨
export type HomeResumeState =
  | {
      status: "none";
    }
  | {
      status: "loading";
    }
  | {
      status: "error";
    }
  | {
      status: "active";
      consultation: {
        title: string;
        stepLabel: string;
        updatedAtLabel: string;
        href: string;
      };
    };

type HomeResumeSectionProps = {
  state: HomeResumeState;
};

export default function HomeResumeSection({
  state,
}: HomeResumeSectionProps) {
  if (state.status === "none") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <section
        className="rounded-card border border-border bg-surface p-5 shadow-card"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="font-semibold text-foreground">
          진행 중 상담을 확인하고 있어요.
        </p>
        <p className="mt-1 text-sm text-foreground-muted">
          잠시만 기다려 주세요.
        </p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        className="rounded-card border border-border bg-surface p-5"
        aria-live="polite"
      >
        <p className="font-semibold text-foreground">
          진행 중 상담을 불러오지 못했어요.
        </p>

        <p className="mt-1 text-sm leading-6 text-foreground-muted">
          새로운 상담과 긴급 대응은 계속 이용할 수 있어요.
        </p>
      </section>
    );
  }

  const { consultation } = state;

  return (
    <section
      aria-labelledby="resume-consultation-heading"
      className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="resume-consultation-heading"
              className="text-lg font-bold text-foreground"
            >
              이어서 진행하기
            </h2>

            <span className="rounded-full bg-primary-subtle px-3 py-1 text-sm font-semibold text-primary">
              진행 중
            </span>
          </div>

          <p className="mt-3 font-semibold text-foreground">
            {consultation.title}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-foreground-muted">
            <span>현재 진행: {consultation.stepLabel}</span>
            <span aria-hidden="true">·</span>
            <span>마지막 저장: {consultation.updatedAtLabel}</span>
          </div>
        </div>

        <Link
          href={consultation.href}
          className={[
            "inline-flex min-h-12 shrink-0 items-center justify-center rounded-control",
            "bg-primary px-6 font-semibold text-primary-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
          ].join(" ")}
        >
          이어서 하기
        </Link>
      </div>
    </section>
  );
}