"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import ConsultationProgress from "@/components/consultation/ConsultationProgress";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";

import {
  getSolutionReportFixture,
  type ReportSourceFixture,
} from "@/lib/fixtures/consultation";

const reportQueryKey = [
  "consultation",
  "solution-report",
] as const;

const reportSections = [
  {
    id: "priority",
    label: "지금 가장 먼저 해야 할 일",
  },
  {
    id: "summary",
    label: "내 상황 요약",
  },
  {
    id: "issue",
    label: "핵심 쟁점",
  },
  {
    id: "procedure",
    label: "예상 절차",
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
    id: "glossary",
    label: "금융용어",
  },
  {
    id: "sources",
    label: "공식 출처",
  },
] as const;

type ReportSectionId =
  (typeof reportSections)[number]["id"];

// 출처 링크 목록
function SourceLinks({
  citationIds,
  sources,
}: {
  citationIds: string[];
  sources: ReportSourceFixture[];
}) {
  const matchedSources = citationIds
    .map((citationId) =>
      sources.find(
        (source) => source.id === citationId,
      ),
    )
    .filter(
      (
        source,
      ): source is ReportSourceFixture =>
        Boolean(source),
    );

  if (matchedSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {matchedSources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className={[
            "inline-flex min-h-10 items-center rounded-control",
            "border border-primary px-3 text-sm font-semibold text-primary",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-focus focus-visible:ring-offset-2",
          ].join(" ")}
        >
          {source.organization} 근거 확인
          <span
            aria-hidden="true"
            className="ml-1"
          >
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}

// 실제 리포트 섹션
// mobile과 desktop에서  report data를 따로 만들지 않는다
function ReportSection({
  id,
  title,
  isExpanded,
  onToggle,
  children,
}: {
  id: ReportSectionId;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentId = `${id}-content`;

  return (
    <section
      id={id}
      className={[
        "scroll-mt-24 rounded-card border border-border",
        "bg-surface shadow-card",
      ].join(" ")}
      aria-labelledby={`${id}-heading`}
    >
      {/* Mobile accordion header */}
      <h2
        id={`${id}-heading`}
        className="lg:hidden"
      >
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          onClick={onToggle}
          className={[
            "flex min-h-16 w-full items-center justify-between gap-4",
            "px-5 py-4 text-left font-bold text-foreground",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-inset focus-visible:ring-focus",
          ].join(" ")}
        >
          <span>{title}</span>

          <span
            aria-hidden="true"
            className="shrink-0 text-primary"
          >
            {isExpanded ? "−" : "+"}
          </span>
        </button>
      </h2>

      {/* Desktop document heading */}
      <h2 className="hidden px-7 pt-7 text-xl font-bold text-foreground lg:block">
        {title}
      </h2>

      <div
        id={contentId}
        className={[
          "px-5 pb-5 lg:block lg:px-7 lg:pb-7 lg:pt-5",
          "print:block",
          isExpanded ? "block" : "hidden",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

export default function SolutionReport() {
  const router = useRouter();

  // 데스크탑 목차에서 현재 활성화되는 섹션
  const [activeSection, setActiveSection] =
    useState<ReportSectionId>("priority");

  // 모바일 아코디언에서 펼쳐진 섹션
  const [expandedSections, setExpandedSections] =
    useState<Set<ReportSectionId>>(
      () =>
        new Set(
          reportSections.map(
            (section) => section.id,
          ),
        ),
    );

  const reportQuery = useQuery({
    queryKey: reportQueryKey,
    queryFn: getSolutionReportFixture,
    retry: false,
  });

  function toggleSection(
    sectionId: ReportSectionId,
  ) {
    setExpandedSections((current) => {
      const next = new Set(current);

      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  }

  function moveToSection(
    sectionId: ReportSectionId,
  ) {
    setActiveSection(sectionId);

    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  if (reportQuery.isLoading) {
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
            해결 리포트를 불러오고 있어요.
          </p>

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

  /*
   * Report 조회 실패.
   *
   * 다시 시도는 Analysis Retry가 아니라
   * Report Query만 다시 조회한다.
   */
  if (reportQuery.isError) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            해결 리포트를 불러오지 못했어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            분석을 다시 실행하지 않고
            <br />
            준비된 리포트를 다시 확인할게요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                reportQuery.refetch()
              }
            >
              다시 시도
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  "/consultation/analysis",
                )
              }
            >
              분석 상태로 돌아가기
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state = reportQuery.data;

  if (!state) {
    return null;
  }

  if (state.kind === "not-ready") {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            아직 리포트가 준비되지 않았어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            분석 상태를 다시 확인해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  "/consultation/analysis",
                )
              }
            >
              분석 상태 확인
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                reportQuery.refetch()
              }
            >
              리포트 다시 확인
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  if (state.kind === "unavailable") {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="해결 리포트"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            리포트를 제공하기 어려워요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            {state.message}
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  "/consultation/summary",
                )
              }
            >
              상담 내용 확인
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  const { report } = state;

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {report.title}
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          {report.description}
        </p>
      </header>

      <div
        className={[
          "mt-10 lg:grid",
          "lg:grid-cols-[220px_minmax(0,1fr)]",
          "lg:items-start lg:gap-6",
        ].join(" ")}
      >
        {/* Desktop sticky navigation */}
        <nav
          aria-label="해결 리포트 목차"
          className={[
            "hidden lg:sticky lg:top-6 lg:block",
            "print:hidden",
          ].join(" ")}
        >
          <ul className="overflow-hidden rounded-card border border-border bg-surface">
            {reportSections.map(
              (section) => {
                const isActive =
                  activeSection === section.id;

                return (
                  <li
                    key={section.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        moveToSection(
                          section.id,
                        )
                      }
                      className={[
                        "w-full px-4 py-4 text-left text-sm font-semibold",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-inset focus-visible:ring-focus",
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
            id="priority"
            title="지금 가장 먼저 해야 할 일"
            isExpanded={expandedSections.has(
              "priority",
            )}
            onToggle={() =>
              toggleSection("priority")
            }
          >
            <ol className="space-y-6">
              {report.priorityActions.map(
                (action, index) => (
                  <li
                    key={action.id}
                    className="flex gap-4"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center",
                        "rounded-control bg-primary font-bold text-primary-foreground",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>

                    <div>
                      <h3 className="font-bold leading-7 text-foreground">
                        {action.title}
                      </h3>

                      <p className="mt-1 leading-7 text-foreground-muted">
                        {action.description}
                      </p>

                      <SourceLinks
                        citationIds={
                          action.citationIds
                        }
                        sources={report.sources}
                      />
                    </div>
                  </li>
                ),
              )}
            </ol>
          </ReportSection>

          <ReportSection
            id="summary"
            title="내 상황 요약"
            isExpanded={expandedSections.has(
              "summary",
            )}
            onToggle={() =>
              toggleSection("summary")
            }
          >
            <ul className="space-y-2">
              {report.situationSummary.map(
                (item) => (
                  <li
                    key={item}
                    className="flex gap-3 leading-7 text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="text-primary"
                    >
                      •
                    </span>

                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
          </ReportSection>

          <ReportSection
            id="issue"
            title="핵심 쟁점"
            isExpanded={expandedSections.has(
              "issue",
            )}
            onToggle={() =>
              toggleSection("issue")
            }
          >
            <p className="leading-8 text-foreground">
              {report.keyIssue}
            </p>
          </ReportSection>

          <ReportSection
            id="procedure"
            title="예상 절차"
            isExpanded={expandedSections.has(
              "procedure",
            )}
            onToggle={() =>
              toggleSection("procedure")
            }
          >
            <ol className="space-y-6">
              {report.expectedProcedure.map(
                (procedure) => (
                  <li
                    key={procedure.step}
                    className="flex gap-4"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center",
                        "rounded-full bg-primary text-sm font-bold text-primary-foreground",
                      ].join(" ")}
                    >
                      {procedure.step}
                    </span>

                    <div>
                      <h3 className="font-bold text-foreground">
                        {procedure.title}
                      </h3>

                      <p className="mt-1 leading-7 text-foreground-muted">
                        {
                          procedure.description
                        }
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </ReportSection>

          <ReportSection
            id="documents"
            title="필요한 서류"
            isExpanded={expandedSections.has(
              "documents",
            )}
            onToggle={() =>
              toggleSection("documents")
            }
          >
            <p className="mb-4 text-sm text-foreground-muted">
              준비할 자료를 확인해 보세요.
            </p>

            <ul className="space-y-3">
              {report.requiredDocuments.map(
                (document) => (
                  <li
                    key={document}
                    className="flex items-start gap-3 leading-7 text-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "mt-1 h-5 w-5 shrink-0 rounded",
                        "border border-border-strong bg-surface",
                      ].join(" ")}
                    />

                    <span>{document}</span>
                  </li>
                ),
              )}
            </ul>
          </ReportSection>

          <ReportSection
            id="cases"
            title="유사 사례"
            isExpanded={expandedSections.has(
              "cases",
            )}
            onToggle={() =>
              toggleSection("cases")
            }
          >
            {report.similarCases.length > 0 ? (
              <div className="space-y-4">
                {report.similarCases.map(
                  (caseItem) => (
                    <article
                      key={caseItem.id}
                      className="rounded-control border border-border bg-surface-subtle p-4"
                    >
                      <h3 className="font-bold text-foreground">
                        {caseItem.title}
                      </h3>

                      <p className="mt-2 leading-7 text-foreground-muted">
                        {caseItem.summary}
                      </p>

                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-foreground-muted">
                            결과
                          </dt>
                          <dd className="mt-1 text-foreground">
                            {caseItem.result}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-semibold text-foreground-muted">
                            참고
                          </dt>
                          <dd className="mt-1 text-foreground">
                            {
                              caseItem.duration
                            }
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p className="rounded-control bg-surface-subtle p-4 leading-7 text-foreground-muted">
                현재 이 리포트에 포함된 유사 사례는
                없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="glossary"
            title="금융용어"
            isExpanded={expandedSections.has(
              "glossary",
            )}
            onToggle={() =>
              toggleSection("glossary")
            }
          >
            {report.glossary.length > 0 ? (
              <dl className="space-y-5">
                {report.glossary.map(
                  (item) => (
                    <div key={item.term}>
                      <dt className="font-bold text-foreground">
                        {item.term}
                      </dt>

                      <dd className="mt-1 leading-7 text-foreground-muted">
                        {item.description}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            ) : (
              <p className="text-foreground-muted">
                추가로 설명할 금융용어가 없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="sources"
            title="공식 출처"
            isExpanded={expandedSections.has(
              "sources",
            )}
            onToggle={() =>
              toggleSection("sources")
            }
          >
            <p className="mb-5 leading-7 text-foreground-muted">
              리포트 작성에 사용된 공식 자료를
              확인할 수 있어요.
            </p>

            <ul className="space-y-4">
              {report.sources.map(
                (source) => (
                  <li
                    key={source.id}
                    className="rounded-control border border-border bg-surface-subtle p-4"
                  >
                    <p className="text-sm font-semibold text-primary">
                      {source.organization}
                    </p>

                    <p className="mt-1 font-bold leading-7 text-foreground">
                      {source.title}
                    </p>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className={[
                        "mt-4 inline-flex min-h-11 items-center",
                        "rounded-control border border-primary px-4",
                        "font-semibold text-primary",
                        "focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-focus focus-visible:ring-offset-2",
                      ].join(" ")}
                    >
                      공식 원문 확인
                      <span
                        aria-hidden="true"
                        className="ml-1"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
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
              중요한 결정을 내리기 전에는 공식 기관의
              원문과 안내를 함께 확인해 주세요.
            </p>
          </section>

          <div className="grid gap-3 pt-2 print:hidden sm:grid-cols-2">
            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push("/")
              }
            >
              홈으로 돌아가기
            </SecondaryButton>

            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => window.print()}
            >
              인쇄하기
            </PrimaryButton>
          </div>
        </article>
      </div>
    </>
  );
}