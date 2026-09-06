"use client";

import {
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  useRouter,
} from "next/navigation";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import {
  useActiveConsultationQuery,
  useConsultationReportQuery,
} from "@/lib/query/consultation";

import {
  useSessionQuery,
} from "@/lib/query/session";

import {
  getReportPageAccess,
} from "@/lib/consultation/access";

import {
  getConsultationStepHref,
} from "@/lib/consultation/navigation";

const reportSections = [
  {
    id: "first-action",
    label: "지금 가장 먼저 해야 할 일",
  },
  {
    id: "overview",
    label: "내 상황 요약",
  },
  {
    id: "issues",
    label: "핵심 쟁점",
  },
  {
    id: "actions",
    label: "행동 단계",
  },
  {
    id: "documents",
    label: "필요한 서류",
  },
  {
    id: "cases",
    label: "유사 사례",
  },
  {
    id: "terms",
    label: "금융용어",
  },
  {
    id: "complaint",
    label: "문의·민원 초안",
  },
  {
    id: "evidence",
    label: "공식 출처",
  },
] as const;

type ReportSectionId =
  (typeof reportSections)[number]["id"];

type ReportSectionProps = {
  id: ReportSectionId;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

// 모바일에서는 Accordion,
// 데스크톱에서는 항상 펼쳐진 문서형 Section으로 사용한다.
function ReportSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
}: ReportSectionProps) {
  const contentId =
    `${id}-content`;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={[
        "scroll-mt-24 rounded-card",
        "border border-border",
        "bg-surface shadow-card",
      ].join(" ")}
    >
      {/* Mobile Accordion Header */}
      <h2
        id={`${id}-heading`}
        className="lg:hidden print:hidden"
      >
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={onToggle}
          className={[
            "flex min-h-16 w-full",
            "items-center justify-between",
            "gap-4 px-5 py-4",
            "text-left font-bold",
            "text-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-inset",
            "focus-visible:ring-focus",
          ].join(" ")}
        >
          <span>
            {title}
          </span>

          <span
            aria-hidden="true"
            className="shrink-0 text-xl text-primary"
          >
            {isExpanded ? "−" : "+"}
          </span>
        </button>
      </h2>

      {/* Desktop / Print Heading */}
      <h2
        id={`${id}-heading-desktop`}
        className={[
          "hidden px-7 pt-7",
          "text-xl font-bold text-foreground",
          "lg:block print:block",
        ].join(" ")}
      >
        {title}
      </h2>

      <div
        id={contentId}
        className={[
          "px-5 pb-5",
          "lg:block lg:px-7 lg:pb-7 lg:pt-5",
          "print:block print:px-7 print:pb-7 print:pt-5",
          isExpanded
            ? "block"
            : "hidden",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

export default function SolutionReport() {
  const router =
    useRouter();

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<ReportSectionId>(
      "first-action",
    );

  // 기존 UX 유지:
  // 처음에는 모든 Section이 펼쳐진 상태이고
  // 모바일 사용자가 원하는 Section만 접을 수 있다.
  const [
    expandedSections,
    setExpandedSections,
  ] =
    useState<Set<ReportSectionId>>(
      () =>
        new Set(
          reportSections.map(
            (section) =>
              section.id,
          ),
        ),
    );

  const sessionQuery =
    useSessionQuery();

  const hasActiveConsultation =
    sessionQuery.isSuccess &&
    sessionQuery.data
      .hasActiveConsultation;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      hasActiveConsultation,
    );

  const consultationId =
    activeConsultationQuery.data
      ?.consultationId ?? null;

  const currentStep =
    activeConsultationQuery.data
      ?.currentStep ?? null;

  const pageAccess =
    getReportPageAccess(
      currentStep,
    );

  // Report Page에서는 생성하지 않는다.
  // 이미 서버에 저장된 Report만 GET으로 조회한다.
  const reportQuery =
    useConsultationReportQuery(
      consultationId,
      pageAccess.status ===
        "allowed",
    );

  function toggleSection(
    sectionId: ReportSectionId,
  ) {
    setExpandedSections(
      (current) => {
        const next =
          new Set(current);

        if (
          next.has(sectionId)
        ) {
          next.delete(
            sectionId,
          );
        } else {
          next.add(
            sectionId,
          );
        }

        return next;
      },
    );
  }

  function moveToSection(
    sectionId: ReportSectionId,
  ) {
    setActiveSection(
      sectionId,
    );

    const prefersReducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    document
      .getElementById(
        sectionId,
      )
      ?.scrollIntoView({
        behavior:
          prefersReducedMotion
            ? "auto"
            : "smooth",
        block: "start",
      });
  }

  const isLoading =
    sessionQuery.isLoading ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isLoading
    ) ||
    (
      pageAccess.status ===
        "allowed" &&
      reportQuery.isLoading
    );

  if (isLoading) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            저장된 해결 리포트를 불러오고 있어요.
          </p>

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

  if (
    sessionQuery.isError ||
    (
      hasActiveConsultation &&
      activeConsultationQuery.isError
    )
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            상담 상태를 확인하지 못했어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            인터넷 연결을 확인한 뒤
            다시 시도해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                void sessionQuery.refetch();

                if (
                  hasActiveConsultation
                ) {
                  void activeConsultationQuery
                    .refetch();
                }
              }}
            >
              다시 시도
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  if (
    sessionQuery.isSuccess &&
    !hasActiveConsultation
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          진행 중인 상담이 없어요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          먼저 상담을 시작해 주세요.
        </p>

        <Link
          href="/"
          className={[
            "mx-auto mt-8 inline-flex",
            "min-h-12 items-center justify-center",
            "rounded-control bg-primary",
            "px-5 py-3 font-bold",
            "text-primary-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-focus",
            "focus-visible:ring-offset-2",
          ].join(" ")}
        >
          홈으로
        </Link>
      </div>
    );
  }

  if (
    pageAccess.status ===
      "wrong-step"
  ) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          아직 해결 리포트를 볼 단계가 아니에요.
        </h1>

        <p className="mt-3 leading-7 text-foreground-muted">
          저장된 상담 단계에서
          계속 진행해 주세요.
        </p>

        <Link
          href={getConsultationStepHref(
            pageAccess.currentStep,
          )}
          className={[
            "mx-auto mt-8 inline-flex",
            "min-h-12 items-center justify-center",
            "rounded-control bg-primary",
            "px-5 py-3 font-bold",
            "text-primary-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-focus",
            "focus-visible:ring-offset-2",
          ].join(" ")}
        >
          현재 단계로 이동
        </Link>
      </div>
    );
  }

  // Report 조회 실패 시 Analysis를 다시 실행하지 않는다.
  // 저장된 Report GET만 다시 수행한다.
  if (reportQuery.isError) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            해결 리포트를 불러오지 못했어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            분석을 다시 실행하지 않고
            <br />
            저장된 리포트만 다시 확인할게요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                void reportQuery.refetch();
              }}
            >
              다시 불러오기
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() => {
                router.push("/");
              }}
            >
              홈으로
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state =
    reportQuery.data;

  if (!state) {
    return null;
  }

  if (
    state.kind ===
      "not-prepared" ||
    !state.report
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            아직 준비된 해결 리포트가 없어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            분석 결과 화면에서
            결과 보기를 다시 눌러 주세요.
          </p>

          <Link
            href="/consultation/analysis"
            className={[
              "mx-auto mt-8 inline-flex",
              "min-h-12 items-center justify-center",
              "rounded-control bg-primary",
              "px-5 py-3 font-bold",
              "text-primary-foreground",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-focus",
              "focus-visible:ring-offset-2",
            ].join(" ")}
          >
            분석 결과로 돌아가기
          </Link>
        </div>
      </>
    );
  }

  const report =
    state.report;

  return (
    <>
      <div className="print:hidden">
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />
      </div>

      <header className="mt-10 text-center sm:mt-12">
        <p className="text-sm font-semibold text-primary">
          AI 해결 리포트
        </p>

        <h1 className="mt-3 break-keep text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {report.headline}
        </h1>

        <div className="mx-auto mt-6 max-w-2xl rounded-control border border-border bg-surface-subtle p-4 text-left">
          <p className="text-sm leading-6 text-foreground-muted">
            {state.evidence.message}
          </p>
        </div>
      </header>

      <div
        className={[
          "mt-10 lg:grid",
          "lg:grid-cols-[220px_minmax(0,1fr)]",
          "lg:items-start lg:gap-6",
        ].join(" ")}
      >
        {/* Desktop Sticky Navigation */}
        <nav
          aria-label="해결 리포트 목차"
          className={[
            "hidden lg:sticky",
            "lg:top-6 lg:block",
            "print:hidden",
          ].join(" ")}
        >
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {reportSections.map(
              (section) => {
                const isActive =
                  activeSection ===
                  section.id;

                return (
                  <li
                    key={section.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      aria-current={
                        isActive
                          ? "location"
                          : undefined
                      }
                      onClick={() =>
                        moveToSection(
                          section.id,
                        )
                      }
                      className={[
                        "w-full px-4 py-4",
                        "text-left text-sm font-semibold",
                        "focus-visible:outline-none",
                        "focus-visible:ring-2",
                        "focus-visible:ring-inset",
                        "focus-visible:ring-focus",
                        isActive
                          ? "bg-primary-subtle text-primary"
                          : "text-foreground hover:bg-surface-subtle",
                      ].join(" ")}
                    >
                      {section.label}
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        </nav>

        <article className="min-w-0 space-y-4">
          <ReportSection
            id="first-action"
            title="지금 가장 먼저 해야 할 일"
            isExpanded={
              expandedSections.has(
                "first-action",
              )
            }
            onToggle={() =>
              toggleSection(
                "first-action",
              )
            }
          >
            <div className="rounded-control bg-primary-subtle p-4 sm:p-5">
              <h3 className="text-lg font-bold text-primary">
                {report.firstAction.title}
              </h3>

              <p className="mt-2 leading-7 text-foreground">
                {report.firstAction.description}
              </p>
            </div>
          </ReportSection>

          <ReportSection
            id="overview"
            title="내 상황 요약"
            isExpanded={
              expandedSections.has(
                "overview",
              )
            }
            onToggle={() =>
              toggleSection(
                "overview",
              )
            }
          >
            <p className="whitespace-pre-line leading-8 text-foreground">
              {report.caseSummary}
            </p>
          </ReportSection>

          <ReportSection
            id="issues"
            title="핵심 쟁점"
            isExpanded={
              expandedSections.has(
                "issues",
              )
            }
            onToggle={() =>
              toggleSection(
                "issues",
              )
            }
          >
            {report.keyIssues.length >
            0 ? (
              <div className="space-y-4">
                {report.keyIssues.map(
                  (
                    issue,
                    index,
                  ) => (
                    <div
                      key={`${issue.title}-${index}`}
                      className="rounded-control bg-surface-subtle p-4"
                    >
                      <h3 className="font-bold leading-7 text-foreground">
                        {issue.title}
                      </h3>

                      <p className="mt-2 leading-7 text-foreground-muted">
                        {
                          issue.explanation
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-foreground-muted">
                별도로 정리된 핵심 쟁점이 없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="actions"
            title="행동 단계"
            isExpanded={
              expandedSections.has(
                "actions",
              )
            }
            onToggle={() =>
              toggleSection(
                "actions",
              )
            }
          >
            <ol className="space-y-6">
              {report.actionSteps.map(
                (step) => (
                  <li
                    key={step.order}
                    className="flex gap-4"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-9 w-9 shrink-0",
                        "items-center justify-center",
                        "rounded-full bg-primary",
                        "text-sm font-bold",
                        "text-primary-foreground",
                      ].join(" ")}
                    >
                      {step.order}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-bold leading-7 text-foreground">
                        {step.title}
                      </h3>

                      <p className="mt-1 leading-7 text-foreground-muted">
                        {
                          step.description
                        }
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>

            {report.actionConsequences
              .length > 0 ? (
              <div className="mt-8">
                <h3 className="font-bold text-foreground">
                  행동 전에 함께 확인할 점
                </h3>

                <div className="mt-4 space-y-3">
                  {report.actionConsequences.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.action}-${index}`}
                        className="rounded-control border border-border bg-surface-subtle p-4"
                      >
                        <p className="font-bold text-foreground">
                          {item.action}
                        </p>

                        <p className="mt-1 leading-7 text-foreground-muted">
                          {
                            item.consequence
                          }
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </ReportSection>

          <ReportSection
            id="documents"
            title="필요한 서류"
            isExpanded={
              expandedSections.has(
                "documents",
              )
            }
            onToggle={() =>
              toggleSection(
                "documents",
              )
            }
          >
            <p className="mb-4 text-sm leading-6 text-foreground-muted">
              상담이나 문의 전에 준비하면 좋은 자료예요.
            </p>

            {report.requiredDocuments
              .length > 0 ? (
              <ul className="space-y-3">
                {report.requiredDocuments.map(
                  (
                    document,
                    index,
                  ) => (
                    <li
                      key={`${document.name}-${index}`}
                      className="flex gap-3 rounded-control bg-surface-subtle p-4"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-1 h-5 w-5",
                          "shrink-0 rounded",
                          "border border-border-strong",
                          "bg-surface",
                        ].join(" ")}
                      />

                      <div>
                        <p className="font-bold text-foreground">
                          {
                            document.name
                          }
                        </p>

                        <p className="mt-1 leading-6 text-foreground-muted">
                          {
                            document.reason
                          }
                        </p>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            ) : (
              <p className="rounded-control bg-surface-subtle p-4 leading-7 text-foreground-muted">
                현재 추가로 제안할 자료는 없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="cases"
            title="유사 사례"
            isExpanded={
              expandedSections.has(
                "cases",
              )
            }
            onToggle={() =>
              toggleSection(
                "cases",
              )
            }
          >
            <div className="rounded-control bg-surface-subtle p-4">
              <p className="leading-7 text-foreground-muted">
                현재 AI V1에서는 검증된
                유사 분쟁 사례를 제공하지 않아요.
              </p>

              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                공식 자료 검색 기능이 연결된 뒤
                검증된 사례만 표시할 예정이에요.
              </p>
            </div>
          </ReportSection>

          <ReportSection
            id="terms"
            title="금융용어"
            isExpanded={
              expandedSections.has(
                "terms",
              )
            }
            onToggle={() =>
              toggleSection(
                "terms",
              )
            }
          >
            {report.terms.length >
            0 ? (
              <dl className="space-y-4">
                {report.terms.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      key={`${item.term}-${index}`}
                      className="rounded-control bg-surface-subtle p-4"
                    >
                      <dt className="font-bold text-foreground">
                        {item.term}
                      </dt>

                      <dd className="mt-1 leading-7 text-foreground-muted">
                        {
                          item.explanation
                        }
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            ) : (
              <p className="text-foreground-muted">
                별도로 설명할 금융용어가 없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="complaint"
            title="문의·민원 초안"
            isExpanded={
              expandedSections.has(
                "complaint",
              )
            }
            onToggle={() =>
              toggleSection(
                "complaint",
              )
            }
          >
            <div className="rounded-control border border-border bg-surface-subtle p-4 sm:p-5">
              <p className="text-sm leading-6 text-foreground-muted">
                아래 내용은 참고용 초안이에요.
                실제 제출 전 사실관계를 다시 확인해 주세요.
              </p>

              <div className="mt-5">
                <h3 className="font-bold text-foreground">
                  제목
                </h3>

                <p className="mt-2 leading-7 text-foreground">
                  {
                    report.complaintDraft
                      .subject
                  }
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-foreground">
                  내용
                </h3>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-foreground">
                  {
                    report.complaintDraft
                      .body
                  }
                </p>
              </div>
            </div>
          </ReportSection>

          <ReportSection
            id="evidence"
            title="공식 출처"
            isExpanded={
              expandedSections.has(
                "evidence",
              )
            }
            onToggle={() =>
              toggleSection(
                "evidence",
              )
            }
          >
            <div className="rounded-control bg-surface-subtle p-4">
              <p className="leading-7 text-foreground-muted">
                {state.evidence.message}
              </p>

              <p className="mt-3 text-sm leading-6 text-foreground-muted">
                확인되지 않은 법령, 판례,
                기관 URL이나 유사 사례를
                임의로 표시하지 않습니다.
              </p>
            </div>
          </ReportSection>

          <section
            aria-labelledby="report-disclaimer-heading"
            className="rounded-card border border-primary bg-primary-subtle p-5 sm:p-6"
          >
            <h2
              id="report-disclaimer-heading"
              className="font-bold text-primary"
            >
              리포트 이용 안내
            </h2>

            <p className="mt-2 leading-7 text-foreground">
              이 리포트는 입력하신 내용을
              이해하고 다음 행동을 정리하기 위한
              참고 자료예요.
            </p>

            <p className="mt-2 leading-7 text-foreground">
              중요한 금융·법률 판단을 하기 전에는
              관련 금융회사나 공식 기관의 안내를
              함께 확인해 주세요.
            </p>
          </section>

          <div className="grid gap-3 pb-8 pt-2 print:hidden sm:grid-cols-2">
            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() => {
                router.push("/");
              }}
            >
              홈으로 돌아가기
            </SecondaryButton>

            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => {
                window.print();
              }}
            >
              인쇄하기
            </PrimaryButton>
          </div>
        </article>
      </div>
    </>
  );
}