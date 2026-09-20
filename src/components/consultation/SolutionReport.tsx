"use client";

import {
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
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
    id: "actions",
    label: "다음 행동",
  },
  {
    id: "overview",
    label: "내 상황",
  },
  {
    id: "issues",
    label: "중요한 점",
  },
  {
    id: "documents",
    label: "필요한 서류",
  },
  {
    id: "citations",
    label: "공식 근거",
  },
  {
    id: "terms",
    label: "금융용어",
  },
  {
    id: "complaint",
    label: "문의·민원 초안",
  },
] as const;

function getPublicCitationLocator(locator: string) {
  const normalized = locator.trim();
  const isHumanReadableLocator =
    /제\s*\d+\s*(?:조(?:의\s*\d+)?|항|호)|\d+\s*(?:쪽|페이지)/.test(normalized);

  return isHumanReadableLocator ? normalized : null;
}

const actionDisplayLabels: Record<string, string> = {
  "report-loss": "분실·도난 신고",
  "confirm-unauthorized-payment": "본인이 하지 않은 결제 확인",
  "confirm-held-card-payment": "본인이 하지 않은 결제 확인",
  "submit-compensation-request": "보상 신청 접수",
  "confirm-compensation-application": "보상 신청 절차 확인",
  "track-compensation-process": "사고 접수와 조사 진행 확인",
  "review-investigation-result": "조사 결과 확인",
  "review-compensation-result": "처리 결과 확인",
  "request-result-review": "결과 재확인 방법 문의",
  "voice-secure-contact": "금융회사 공식 채널에 문의",
  "voice-report-financial": "금융회사에 신고",
  "voice-report-police": "경찰에 신고",
  "account-transfer-report": "금융회사에 본인 아닌 거래 신고",
  "account-transfer-protect": "인증수단을 안전하게 보호",
  "smishing-stop-contact": "의심 링크와 앱 사용 중단",
  "smishing-report-financial": "금융회사에 금전 피해 신고",
};

function getUserFacingActionTitle(
  title: string,
  actionId?: string | null,
) {
  if (actionId && actionDisplayLabels[actionId]) {
    return actionDisplayLabels[actionId];
  }

  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(title)) {
    return "안내된 절차 확인";
  }

  return title
    .replaceAll("미인지 신용판매", "본인이 하지 않은 결제")
    .replaceAll("미인지 결제", "모르는 결제");
}

function getUserFacingReportHeadline(headline: string) {
  return headline
    .replaceAll("미인지 신용판매", "모르는 카드 결제")
    .replaceAll("미인지 결제", "모르는 결제")
    .replaceAll("미인지", "모르는")
    .replaceAll("대응 리포트", "대응 안내")
    .replaceAll("리포트", "안내");
}

function getUserFacingEvidenceMessage(message: string) {
  if (/(?:CARD|Procedure|FAP|Evidence|AI\s*V?\d|KURE|retrieval)/i.test(message)) {
    return "검토된 공식 자료와 법령을 바탕으로 정리했어요.";
  }

  return message;
}

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
      className="mt-8 scroll-mt-24 border-b border-border bg-surface first:mt-0 last:border-b-0"
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
            "gap-4 py-5",
            "rounded-control px-4 text-left text-lg font-bold",
            isExpanded ? "text-primary" : "text-foreground",
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
          "hidden pt-7",
          "text-xl font-bold text-foreground",
          "lg:block print:block",
        ].join(" ")}
      >
        {title}
      </h2>

      <div
        id={contentId}
        className={[
          "px-5 pb-7 pt-4",
          "lg:block lg:px-5 lg:pb-8 lg:pt-5",
          "print:block print:px-5 print:pb-8 print:pt-5",
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

  // 핵심 행동은 바로 읽고, 긴 참고 정보는 필요할 때 펼친다.
  const [
    expandedSections,
    setExpandedSections,
  ] =
    useState<Set<ReportSectionId>>(
      () => new Set<ReportSectionId>([
        "first-action",
        "actions",
        "overview",
        "issues",
        "documents",
      ]),
    );

  const [expandedTermIndexes, setExpandedTermIndexes] =
    useState<Set<number>>(() => new Set());

  const sessionQuery =
    useSessionQuery();
  const searchParams = useSearchParams();
  const requestedConsultationId = searchParams.get("consultationId");

  const hasActiveConsultation =
    sessionQuery.isSuccess &&
    sessionQuery.data
      .hasActiveConsultation;

  const useActiveConsultationFallback =
    !requestedConsultationId &&
    hasActiveConsultation;

  const activeConsultationQuery =
    useActiveConsultationQuery(
      useActiveConsultationFallback,
    );

  const consultationId =
    requestedConsultationId ?? activeConsultationQuery.data?.consultationId ?? null;

  const currentStep =
    requestedConsultationId
      ? "REPORT"
      : activeConsultationQuery.data?.currentStep ?? null;

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
      useActiveConsultationFallback &&
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
          label="결과"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            저장된 결과를 불러오고 있어요.
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
      useActiveConsultationFallback &&
      activeConsultationQuery.isError
    )
  ) {
    return (
      <>
        <ConsultationProgress
          currentStep={6}
          totalSteps={6}
          label="결과"
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

                if (useActiveConsultationFallback) {
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
    !requestedConsultationId &&
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
          아직 결과를 볼 단계가 아니에요.
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
          label="결과"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            결과를 불러오지 못했어요.
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
          label="결과"
        />

        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            아직 준비된 결과가 없어요.
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
          label="결과"
        />
      </div>

      <header className="mx-auto mt-9 max-w-3xl text-center sm:mt-12">
        <p className="text-base font-bold text-primary">
          결과
        </p>

        <h1 className="mt-3 break-keep text-[2rem] font-bold leading-[1.28] tracking-[-0.025em] text-foreground sm:text-4xl">
          {getUserFacingReportHeadline(report.headline)}
        </h1>

        <div className="mx-auto mt-5 inline-flex max-w-2xl items-center gap-2 text-left">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          <p className="text-[0.9375rem] font-medium leading-6 text-foreground-muted">
            {getUserFacingEvidenceMessage(state.evidence.message)}
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
          aria-label="결과 목차"
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

        <article className="min-w-0 border-t border-border">
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
            <div className="border-l-4 border-primary bg-primary-subtle px-5 py-4">
              <h3 className="break-keep text-lg font-bold text-primary">
                {getUserFacingActionTitle(
                  report.firstAction.title,
                  report.firstAction.actionId,
                )}
              </h3>

              <p className="mt-2 break-keep leading-7 text-foreground">
                {report.firstAction.description}
              </p>
            </div>
          </ReportSection>

          <ReportSection
            id="actions"
            title="다음 행동"
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
                      <h3 className="break-keep font-bold leading-7 text-foreground">
                        {getUserFacingActionTitle(
                          step.title,
                          step.actionId,
                        )}
                      </h3>

                      <p className="mt-1 break-keep leading-7 text-foreground-muted">
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
              <div className="mt-10 border-t border-border pt-8">
                <h3 className="font-bold text-foreground">
                  진행하기 전에 확인해 주세요
                </h3>

                <div className="mt-4 space-y-3">
                  {report.actionConsequences.map(
                    (
                      item,
                      index,
                    ) => (
                      <div
                        key={`${item.action}-${index}`}
                        className="border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0"
                      >
                        <p className="break-keep font-bold text-foreground">
                          {getUserFacingActionTitle(item.action)}
                        </p>

                        <p className="mt-1 break-keep leading-7 text-foreground-muted">
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
            id="overview"
            title="내 상황"
            isExpanded={expandedSections.has("overview")}
            onToggle={() => toggleSection("overview")}
          >
            <details className="group">
              <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-control px-4 font-semibold text-foreground group-open:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
                <span>상황 설명 자세히 보기</span>
                <span aria-hidden="true" className="text-xl">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-5 whitespace-pre-line border-t border-border pt-5 break-keep leading-8 text-foreground">
                {report.caseSummary}
              </p>
            </details>
          </ReportSection>

          <ReportSection
            id="issues"
            title="중요한 점"
            isExpanded={expandedSections.has("issues")}
            onToggle={() => toggleSection("issues")}
          >
            {report.keyIssues.length > 0 ? (
              <div className="divide-y divide-border">
                {report.keyIssues.map((issue, index) => (
                  <div key={`${issue.title}-${index}`} className="py-5 first:pt-0 last:pb-0">
                    <h3 className="break-keep font-bold leading-7 text-foreground">
                      {issue.title}
                    </h3>
                    <p className="mt-2 break-keep leading-7 text-foreground-muted">
                      {issue.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-foreground-muted">
                별도로 정리된 중요한 점이 없어요.
              </p>
            )}
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
              <ul className="divide-y divide-border">
                {report.requiredDocuments.map(
                  (
                    document,
                    index,
                  ) => (
                    <li
                      key={`${document.name}-${index}`}
                      className="flex gap-3 border-b border-border py-5 last:border-b-0"
                    >
                      <span
                        aria-hidden="true"
                        className={[
                          "mt-0.5 flex h-9 w-9 shrink-0",
                          "items-center justify-center rounded-control",
                          "bg-primary-subtle text-primary",
                        ].join(" ")}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                        >
                          <path
                            d="M7 3.75h6.5L18 8.25v12H7z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13.5 3.75v4.5H18M9.5 12h6M9.5 15.5h6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <div className="min-w-0">
                        <p className="break-keep font-bold text-foreground">
                          {
                            document.name
                          }
                        </p>

                        <p className="mt-1 break-keep leading-6 text-foreground-muted">
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
              <p className="leading-7 text-foreground-muted">
                현재 추가로 제안할 자료는 없어요.
              </p>
            )}
          </ReportSection>

          <ReportSection
            id="citations"
            title="공식 근거"
            isExpanded={expandedSections.has("citations")}
            onToggle={() => toggleSection("citations")}
          >
            <p className="break-keep leading-7 text-foreground-muted">
              {getUserFacingEvidenceMessage(state.evidence.message)}
            </p>
            {report.citations.length > 0 ? (
              <ul className="mt-5 divide-y divide-border">
                {report.citations.map((citation) => {
                  const publicLocator = getPublicCitationLocator(citation.locator);

                  return (
                    <li key={`${citation.evidenceId}-${citation.locator}`} className="py-5 first:pt-0 last:pb-0">
                      <p className="break-keep font-bold text-foreground">
                        {citation.label ?? "검토된 공식 자료"}
                      </p>
                      {publicLocator ? (
                        <p className="mt-1 break-words text-[0.9375rem] leading-6 text-foreground-muted">
                          {publicLocator}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
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
              <dl className="divide-y divide-border">
                {report.terms.map(
                  (
                    item,
                    index,
                  ) => (
                    <div key={`${item.term}-${index}`} className="py-1">
                      <dt>
                        <button
                          type="button"
                          aria-expanded={expandedTermIndexes.has(index)}
                          aria-controls={`term-${index}-definition`}
                          onClick={() => {
                            setExpandedTermIndexes((current) => {
                              const next = new Set(current);
                              if (next.has(index)) next.delete(index);
                              else next.add(index);
                              return next;
                            });
                          }}
                          className={[
                            "flex min-h-14 w-full items-center justify-between gap-4 rounded-control px-4 py-3 text-left font-semibold",
                            expandedTermIndexes.has(index)
                              ? "text-primary"
                              : "text-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                          ].join(" ")}
                        >
                          <span className="break-keep">{item.term}</span>
                          <span aria-hidden="true" className="text-xl">
                            {expandedTermIndexes.has(index) ? "−" : "+"}
                          </span>
                        </button>
                      </dt>

                      <dd
                        id={`term-${index}-definition`}
                        className={[
                          "break-keep px-4 pb-4 pt-2 leading-7 text-foreground-muted",
                          expandedTermIndexes.has(index) ? "block" : "hidden",
                        ].join(" ")}
                      >
                        {item.explanation}
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

          <div className="mt-8 border-t border-border">
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
              <div>
                <p className="break-keep text-sm leading-6 text-foreground-muted">
                  아래 내용은 참고용 초안이에요.
                  실제 제출 전 사실관계를 다시 확인해 주세요.
                </p>

              <div className="mt-5">
                <h3 className="font-bold text-foreground">
                  제목
                </h3>

                <p className="mt-2 break-keep leading-7 text-foreground">
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

                <p className="mt-2 whitespace-pre-wrap break-keep leading-7 text-foreground">
                  {
                    report.complaintDraft
                      .body
                  }
                </p>
              </div>
              </div>
            </ReportSection>
          </div>

          <section
            aria-labelledby="report-disclaimer-heading"
            className="mt-8 border-t border-border px-5 py-8"
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
