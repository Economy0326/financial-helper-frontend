"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ReviewWorkQueue, SourceText, formatSeoulTime, reviewStatusLabel } from "@/components/source-review/SourceReviewComponents";
import { ApiResponseError } from "@/lib/api/errors";
import { informationReviewApi, sourceReviewApi, type InformationReviewAudit,
  type InformationReviewCandidate, type InformationReviewDocument,
  type InformationReviewState, type InformationReviewGuide, type ReviewableSource } from "@/lib/api/source-review";
import type { TemporalEvidencePolicy } from "@/lib/api/source-review";
import type { InformationClaimScope, ReviewCorrectionCode } from "@/lib/api/source-review";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";

const enabled = process.env.NEXT_PUBLIC_OFFICIAL_REVIEW_ENABLED === "true";
const button = "min-h-11 rounded-control border border-primary px-4 font-semibold text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const temporalLabels: Record<TemporalEvidencePolicy, string> = {
  EXPLICIT_EFFECTIVE: "명시된 제도 적용일", VERSION_EFFECTIVE: "특정 법령 판본",
  CURRENT_GUIDANCE: "기한을 정해 확인한 현재 안내", HISTORICAL_FACT: "과거 특정 기간의 사실",
  CONTRACT_DATE: "계약 체결일 기준", DYNAMIC_CHECK: "자주 변경되는 현재 정보", HOLD: "시간 근거 부족 · 보류",
};
const meaningLabels = { PUBLICATION: "게시·발표", AMENDMENT: "개정 날짜", EFFECTIVE: "제도 적용·시행",
  LAW_EFFECTIVE: "법령 시행", CONTRACT: "계약 기준", HISTORICAL: "과거 기준",
  UNCLEAR: "의미 확인 필요" } as const;
const correctionLabels: Record<ReviewCorrectionCode, string> = {
  SOURCE_DATE_MISCLASSIFIED: "날짜 의미 정정", SOURCE_CONTEXT_MISSING: "다른 원문 문맥 확인",
  REVIEWER_CURRENTNESS_CHECK: "공식 원문의 현재성 직접 확인",
  CLAIM_OUTSIDE_SOURCE: "원문에 없는 주장", CONDITION_MISSING: "필수 조건 누락",
  EXCEPTION_MISSING: "예외 누락", OTHER_SCOPE: "적용 범위 정정",
};
type TemporalInput = { policy: TemporalEvidencePolicy; start: string; end: string;
  verifiedOn: string; validUntil: string };
function validTemporal(input: TemporalInput): boolean {
  if (input.policy === "HOLD") return true;
  if (input.policy === "VERSION_EFFECTIVE") return !!input.start &&
    (!!input.end && input.end >= input.start || !!input.verifiedOn && !!input.validUntil
      && input.validUntil >= input.verifiedOn
      && new Date(input.validUntil).getTime() - new Date(input.verifiedOn).getTime() <= 365 * 86400000);
  if (["CURRENT_GUIDANCE", "DYNAMIC_CHECK"].includes(input.policy))
    return !!input.verifiedOn && !!input.validUntil && input.validUntil >= input.verifiedOn
      && new Date(input.validUntil).getTime() - new Date(input.verifiedOn).getTime()
        <= (input.policy === "DYNAMIC_CHECK" ? 30 : 365) * 86400000;
  return !!input.start && (input.policy === "EXPLICIT_EFFECTIVE"
    ? !input.end || input.end >= input.start : !!input.end && input.end >= input.start);
}

function messageFor(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (error.status === 401) return "로그인 후 다시 시도해 주세요.";
    if (error.status === 403) return "이 계정에는 공식자료 Reviewer 권한이 없습니다.";
    if (error.code === "SOURCE_REVIEW_DOCUMENT_MISSING") return "이 공식자료는 아직 수집되지 않았습니다.";
    if (error.code === "SOURCE_REVIEW_INCOMPLETE") return "시간 근거 또는 필수 조건·예외를 확인해야 합니다.";
    if (error.code === "SOURCE_REVIEW_CURRENTNESS_UNVERIFIED") return "공식 URL의 현재 판본을 검증한 기록이 없어 승인할 수 없습니다.";
    if (error.code === "SOURCE_REVIEW_CORRECTION_REQUIRED") return "공식 원문의 현재성과 적용 범위를 확인해야 합니다.";
    if (error.code === "SOURCE_REVIEW_SCOPE_INVALID") return "근거 적용 기간 또는 다른 항목의 시간 범위를 확인해야 합니다.";
    if (error.code === "SOURCE_REVIEW_VERSION_CHANGED") return "문서 판본이 달라졌습니다. 저장된 상태를 다시 확인해 주세요.";
    if (error.code === "SOURCE_REVIEW_ALREADY_DECIDED") return "이 항목은 이미 다른 결정이 기록됐습니다.";
    return `요청을 완료하지 못했습니다. 상태 ${error.status}, 코드 ${error.code ?? "UNKNOWN"}`;
  }
  return "서버 응답을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.";
}

export default function InformationSourceReviewPage() {
  const params = useParams<{ sourceKey: string }>();
  const sourceKey = params.sourceKey;
  const api = useMemo(() => informationReviewApi(sourceKey), [sourceKey]);
  const [source, setSource] = useState<ReviewableSource | null>(null);
  const [document, setDocument] = useState<InformationReviewDocument | null>(null);
  const [candidates, setCandidates] = useState<InformationReviewCandidate[]>([]);
  const [reviews, setReviews] = useState<InformationReviewState[]>([]);
  const [audits, setAudits] = useState<InformationReviewAudit[]>([]);
  const [guide, setGuide] = useState<InformationReviewGuide | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [temporalPolicy, setTemporalPolicy] = useState<TemporalEvidencePolicy>("HOLD");
  const [verifiedOn, setVerifiedOn] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [claimTimes, setClaimTimes] = useState<Record<string, TemporalInput>>({});
  const [scopeChecked, setScopeChecked] = useState(false);
  const [itemChecked, setItemChecked] = useState<Record<string, boolean>>({});
  const [corrections, setCorrections] = useState<Record<string, { code: ReviewCorrectionCode | ""; locator: string }>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await sourceReviewApi.sources();
      const chosen = list.find((row) => row.sourceKey === sourceKey && row.reviewWorkflowAvailable);
      if (!chosen) { setMessage("이 자료의 항목별 검토는 지원하지 않습니다."); return; }
      setSource(chosen);
      setGuide(await api.guidance());
      if (!chosen.documentId) { setDocument(null); setCandidates([]); setReviews([]); setAudits([]); return; }
      const current = await api.document();
      const [claimRows, reviewRows, auditRows] = await Promise.all([
        api.candidates(current.documentId), api.reviews(current.documentId), api.audit(current.documentId),
      ]);
      setDocument(current);
      setCandidates(claimRows);
      setClaimTimes((old) => {
        const next = { ...old };
        for (const claim of claimRows.filter((row) => row.role === "SUPPORT")) {
          if (next[claim.chunkId]) continue;
          const recommendation = claim.temporalAssistance;
          const date = recommendation.mentions.find((mention) => mention.inClaim)?.date ?? "";
          next[claim.chunkId] = { policy: recommendation.recommendedPolicy,
            start: recommendation.recommendedPolicy === "HOLD" ? "" : date,
            end: "", verifiedOn: "", validUntil: "" };
        }
        return next;
      });
      setReviews(reviewRows);
      setAudits(auditRows);
      if (reviewRows.length > 0) {
        const latest = reviewRows[reviewRows.length - 1];
        setStartDate(latest.start ?? "");
        setEndDate(latest.end ?? "");
        setTemporalPolicy(latest.temporalPolicy);
        setVerifiedOn(latest.temporalVerifiedOn ?? "");
        setValidUntil(latest.temporalValidUntil ?? "");
      }
    } catch (error) { setMessage(messageFor(error)); }
  }, [api, sourceKey]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, success: string) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await action(); await load(); setMessage(success); }
    catch (error) { setMessage(messageFor(error)); }
    finally { setBusy(false); }
  }

  if (!enabled) return <main className="p-8">공식자료 검토 화면은 허용된 시연 환경에서만 사용할 수 있습니다.</main>;

  const supportCandidates = candidates.filter((item) => item.role === "SUPPORT")
    .sort((left, right) => {
      const rank = (chunkId: string) => {
        const status = reviews.find((row) => row.chunkId === chunkId)?.status;
        return status === "APPROVED" ? 1 : status === "REJECTED" ? 2 : 0;
      };
      return rank(left.chunkId) - rank(right.chunkId);
    });
  const conditionCandidates = candidates.filter((item) => item.role === "CONDITION");
  const currentReviews = supportCandidates.map((item) => reviews.filter((row) => row.chunkId === item.chunkId).at(-1))
    .filter((row): row is InformationReviewState => !!row);
  const prepared = currentReviews.some((row) => row.status === "PENDING" || row.status === "APPROVED");
  const official = source ? safeOfficialLink(source.officialUrl) : null;
  const defaultTime: TemporalInput = { policy: temporalPolicy, start: startDate, end: endDate,
    verifiedOn, validUntil };
  const timeFor = (chunkId: string): TemporalInput => claimTimes[chunkId] ?? defaultTime;
  const datedPolicy = ["EXPLICIT_EFFECTIVE", "VERSION_EFFECTIVE", "HISTORICAL_FACT", "CONTRACT_DATE"].includes(temporalPolicy);
  const checkedPolicy = temporalPolicy === "CURRENT_GUIDANCE" || temporalPolicy === "DYNAMIC_CHECK"
    || temporalPolicy === "VERSION_EFFECTIVE";
  const validTime = supportCandidates.every((item) => validTemporal(timeFor(item.chunkId)));
  const canPrepare = document && document.storedBytesMatchHash && supportCandidates.length > 0 && !prepared
    && validTime && scopeChecked;
  const claimScopes = (): InformationClaimScope[] => supportCandidates.map((item) => {
    const value = timeFor(item.chunkId);
    const isChecked = value.policy === "CURRENT_GUIDANCE" || value.policy === "DYNAMIC_CHECK";
    return { chunkId: item.chunkId, policy: value.policy,
      start: isChecked || value.policy === "HOLD" ? null : value.start || null,
      end: isChecked || value.policy === "HOLD" ? null : value.end || null,
      verifiedOn: isChecked || value.policy === "VERSION_EFFECTIVE" ? value.verifiedOn || null : null,
      validUntil: isChecked || value.policy === "VERSION_EFFECTIVE" ? value.validUntil || null : null };
  });
  const approved = prepared && currentReviews.length === supportCandidates.length
    && currentReviews.every((row) => row.status === "APPROVED")
    && conditionCandidates.every((item) => item.status === "APPROVED");

  return <div className="min-h-screen bg-background"><AppHeader />
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header><Link href="/official-source-review" className="text-primary underline">공식자료 목록으로 이동</Link>
        <h1 className="mt-3 text-3xl font-bold">공식자료 검토</h1>
        <p className="mt-2 break-words">{source?.title ?? `${source?.organization ?? "공식기관"} 자료 · 제목 확인 전`}</p>
        <p className="text-sm text-foreground-muted">이 화면의 원문 확인·검토표 준비는 승인 결정이 아닙니다. 승인 후에도 READY 검증 전에는 검색에 사용되지 않습니다.</p>
      </header>
      {prepared && <ReviewWorkQueue items={currentReviews.map((row) => ({
        id: `item-${row.chunkId}`, title: candidates.find((item) => item.chunkId === row.chunkId)?.label ?? "근거 항목", status: row.status,
      }))} />}
      {message && <p role="status" className="rounded-control border border-border p-3">{message}</p>}
      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="text-xl font-bold">공식 원문과 저장 판본</h2>
        <p className="mt-2">기관: {source?.organization ?? "확인 전"} · 게시일: {document?.publishedAt ?? "확인 전"}</p>
        <p>판본: {document?.version ?? "미수집"} · 원본 바이트 Hash: {document?.storedBytesMatchHash ? "DB 기록과 일치" : "확인 전 또는 불일치"}</p>
        <p className="text-sm">이 검사는 저장된 바이트와 DB 기록만 비교합니다. 공식 URL의 최신 변경 여부는 확인하지 않습니다.</p>
        {document && <details><summary className="cursor-pointer">Hash 기술 상세</summary><code className="break-all">{document.rawSha256}</code>
          <p>수집 시각: {formatSeoulTime(document.retrievedAt)} (한국 시간)</p></details>}
        {official && <a href={official} target="_blank" rel="noopener noreferrer" className={`${button} mt-3 inline-flex items-center`}>공식 원문 보기 ↗ (외부 사이트)</a>}
        <div className="mt-4 flex flex-wrap gap-2">
          {!document && <button type="button" className={button} disabled={busy || !source} onClick={() => void run(api.ingest, "공식자료 수집 결과를 확인했습니다.")}>공식자료 처음 수집하기</button>}
          {document && candidates.length === 0 && <button type="button" className={button} disabled={busy} onClick={() => void run(() => api.extract(document.documentId), "검토 후보 항목을 추출했습니다.")}>근거 후보 추출하기</button>}
          <button type="button" className={button} disabled={busy} onClick={() => void run(async () => {}, "저장된 상태를 다시 조회했습니다.")}>{busy ? "처리 중…" : "상태 다시 조회"}</button>
        </div>
      </section>
      <section className="space-y-4" aria-label="공식 근거 항목"><h2 className="text-xl font-bold">근거 항목 · 검토 필요 {supportCandidates.filter((item) =>
        reviews.find((row) => row.chunkId === item.chunkId)?.status !== "APPROVED").length}건</h2>
        {!supportCandidates.length && <p>추출된 검토 후보가 없습니다.</p>}
        {supportCandidates.map((item) => { const review = currentReviews.find((row) => row.chunkId === item.chunkId);
          const itemAudits = audits.filter((row) => row.reviewId === review?.reviewId);
          const selectedTime = timeFor(item.chunkId);
          const effectivePolicy = review?.temporalPolicy ?? selectedTime.policy;
          const effectiveStart = review ? review.start : selectedTime.start;
          const effectiveEnd = review ? review.end : selectedTime.end;
          const currentnessBlocked = ["CURRENT_GUIDANCE", "DYNAMIC_CHECK"].includes(effectivePolicy)
            || effectivePolicy === "VERSION_EFFECTIVE" && !effectiveEnd;
          const needsCorrection = effectivePolicy !== item.temporalAssistance.recommendedPolicy ||
            !!effectiveStart && !item.temporalAssistance.mentions.some((mention) => mention.inClaim && mention.date === effectiveStart);
          const correction = corrections[item.chunkId] ?? { code: "" as const, locator: "" };
          const invalidForApproval = ["CLAIM_OUTSIDE_SOURCE", "CONDITION_MISSING", "EXCEPTION_MISSING"].includes(correction.code)
            || ["CURRENT_GUIDANCE", "DYNAMIC_CHECK"].includes(effectivePolicy)
              && !!correction.code && correction.code !== "REVIEWER_CURRENTNESS_CHECK";
          const updateCorrection = (patch: Partial<typeof correction>) => setCorrections((old) => ({ ...old,
            [item.chunkId]: { ...correction, ...patch } }));
          return <article id={`item-${item.chunkId}`} key={item.chunkId} className="scroll-mt-6 rounded-card border border-border bg-surface p-5">
            <h3 className="font-bold">{item.label} · {review?.status === "APPROVED" ? "승인 완료 · 활성화 여부는 질문별 확인" :
              review?.status === "REJECTED" ? "사용하지 않음 · 원문 불일치" :
                review?.temporalPolicy === "HOLD" ? "사용 보류 · 적용 범위 확인 필요" : "검토 필요"}</h3>
            {item.chunkId === supportCandidates[0]?.chunkId && <>{document && !prepared && <section className="mt-3 rounded-control border border-border p-4">
        <h2 className="text-xl font-bold">근거 적용 범위 확인</h2>
        <p className="mt-2 text-sm">게시일·수집일·승인일은 제도 적용일이 아닙니다. 시간 근거가 불명확하면 보류 정책으로 검토표만 준비할 수 있고 승인·READY는 차단됩니다.</p>
        <details className="mt-3"><summary className="cursor-pointer font-semibold">시간 근거를 직접 조정해야 할 때</summary>
        <label className="mt-3 block">기본 시간 근거 유형 <select value={temporalPolicy} disabled={prepared || busy}
          onChange={(event) => setTemporalPolicy(event.target.value as TemporalEvidencePolicy)} className="ml-2 rounded-control border border-border p-2">
          {Object.entries(temporalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        {datedPolicy && <div className="mt-3 flex flex-wrap gap-3"><label>근거 적용 시작일 또는 판본 시행일 <input type="date" value={startDate} disabled={prepared || busy}
          onChange={(event) => setStartDate(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label>
          <label>근거 적용 종료일 (선택) <input type="date" value={endDate} disabled={prepared || busy}
          onChange={(event) => setEndDate(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label></div>}
        {checkedPolicy && <div className="mt-3 flex flex-wrap gap-3"><label>공식자료 확인 기준일 <input type="date" value={verifiedOn} disabled={prepared || busy}
          onChange={(event) => setVerifiedOn(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label>
          <label>재확인 기한 <input type="date" value={validUntil} disabled={prepared || busy}
          onChange={(event) => setValidUntil(event.target.value)} className="ml-2 rounded-control border border-border p-2" /></label></div>}
        <p className="mt-2 text-sm">현재성 확인은 최초 시행일의 증거가 아닙니다. 법령 판본·계약·과거 사실은 질문 시점과 적용 대상을 별도로 확인합니다.</p>
        {supportCandidates.length > 1 && <div className="mt-3 space-y-3" aria-label="근거 항목별 시간 범위">
          {supportCandidates.map((item) => { const value = timeFor(item.chunkId);
            const update = (patch: Partial<TemporalInput>) => setClaimTimes((old) => ({ ...old,
              [item.chunkId]: { ...timeFor(item.chunkId), ...patch } }));
            return <fieldset key={item.chunkId} className="rounded-control border border-border p-3" disabled={prepared || busy}>
              <legend className="font-semibold">{item.label}의 시간 근거</legend>
              <select aria-label={`${item.label} 시간 근거 유형`} value={value.policy}
                onChange={(event) => update({ policy: event.target.value as TemporalEvidencePolicy })}>
                {Object.entries(temporalLabels).map(([policy, label]) => <option key={policy} value={policy}>{label}</option>)}
              </select>
              {["CURRENT_GUIDANCE", "DYNAMIC_CHECK"].includes(value.policy)
                ? <div className="flex flex-wrap gap-2"><label>확인 기준일 <input type="date" value={value.verifiedOn}
                    onChange={(event) => update({ verifiedOn: event.target.value })} /></label>
                    <label>재확인 기한 <input type="date" value={value.validUntil}
                    onChange={(event) => update({ validUntil: event.target.value })} /></label></div>
                : value.policy !== "HOLD" && <div className="flex flex-wrap gap-2"><label>적용 시작일 <input type="date" value={value.start}
                    onChange={(event) => update({ start: event.target.value })} /></label>
                    <label>적용 종료일 <input type="date" value={value.end}
                    onChange={(event) => update({ end: event.target.value })} /></label>
                    {value.policy === "VERSION_EFFECTIVE" && <><label>확인 기준일 <input type="date" value={value.verifiedOn}
                    onChange={(event) => update({ verifiedOn: event.target.value })} /></label>
                    <label>재확인 기한 <input type="date" value={value.validUntil}
                    onChange={(event) => update({ validUntil: event.target.value })} /></label></>}</div>}
            </fieldset>;
          })}</div>}
        </details>
        <label className="mt-3 flex gap-2"><input type="checkbox" checked={scopeChecked} disabled={prepared || busy}
          onChange={(event) => setScopeChecked(event.target.checked)} />원본 판본·적용 대상·시점·제외 범위를 직접 확인했습니다.</label>
        <button type="button" className={`${button} mt-3`} disabled={!canPrepare || busy}
          onClick={() => { if (window.confirm("현재 판본과 주장별 시간 근거로 검토표를 준비하시겠습니까? 아직 승인은 아닙니다."))
            void run(() => api.prepare(document.documentId, document.rawSha256,
              datedPolicy ? startDate : null, datedPolicy ? endDate || null : null,
              temporalPolicy, checkedPolicy ? verifiedOn : null, checkedPolicy ? validUntil : null,
              supportCandidates.map((item): InformationClaimScope => { const value = timeFor(item.chunkId);
                const isChecked = value.policy === "CURRENT_GUIDANCE" || value.policy === "DYNAMIC_CHECK";
                return { chunkId: item.chunkId, policy: value.policy,
                  start: isChecked || value.policy === "HOLD" ? null : value.start || null,
                  end: isChecked || value.policy === "HOLD" ? null : value.end || null,
                  verifiedOn: isChecked || value.policy === "VERSION_EFFECTIVE" ? value.verifiedOn || null : null,
                  validUntil: isChecked || value.policy === "VERSION_EFFECTIVE" ? value.validUntil || null : null };
              })),
              "검토표를 준비했습니다. 항목별 승인은 별도 결정입니다."); }}>
          검토 시작하기</button>
        {!canPrepare && !prepared && <p className="mt-2 text-sm">원본 바이트 일치, 후보 추출, 선택한 시간 근거의 필수 값과 확인 체크가 필요합니다.</p>}
      </section>}</>}
            <p className="mt-1 text-sm">원문 위치: {item.article ?? item.page ?? "본문"}</p>
            {review && <p className="mt-1 text-sm">시간 검토 상태: {({ HOLD: "보류", REVOKED: "철회",
              RECHECK_REQUIRED: "재확인 필요", REVIEW_REQUIRED: "검토 결정 필요", EFFECTIVE_WINDOW_REVIEWED: "적용 기간 기록됨",
              REVIEWER_CHECK_WINDOW: "검토자 확인 기간 기록됨" } as Record<string, string>)[review.temporalState] ?? "확인 불가"}</p>}
            <details className="mt-1"><summary className="cursor-pointer">UTF-16 위치 기술 상세</summary><code className="break-all">{item.locator}</code></details>
            <details open={!review || review.status === "PENDING"} className="mt-3"><summary className="cursor-pointer font-semibold">저장된 원문 전체 읽기</summary>
              <SourceText body={item.body} squareParagraphGlyph /></details>
            {guide && item.chunkId === supportCandidates[0]?.chunkId && <div className="mt-3 rounded-control border border-border p-3 text-sm">
              <p><strong>추출된 주장:</strong> {guide.support}</p>
              <p><strong>확인할 조건·예외:</strong> {guide.condition} · {guide.exception}</p>
              <p><strong>미확인 범위:</strong> {guide.hold}</p>
              <details><summary className="cursor-pointer">검토 문맥 상세</summary>
                <p>{guide.location} · {guide.dateNote}</p></details>
            </div>}
            <section className="mt-3 rounded-control border border-border p-3" aria-label={`${item.label} 시간 근거 분석`}>
              <h4 className="font-semibold">원문 기반 시간 검토 보조</h4>
              <p className="text-sm">문서 게시일: {item.temporalAssistance.documentPublishedAt ?? "미확인"} · 추천 정책: {temporalLabels[item.temporalAssistance.recommendedPolicy]}</p>
              <p className="text-sm">{item.temporalAssistance.reason} {item.temporalAssistance.currentnessNotice}</p>
              {item.temporalAssistance.recommendedPolicy !== "HOLD" &&
                item.temporalAssistance.mentions.filter((mention) => mention.inClaim).length === 1 &&
                <button type="button" className={`${button} mt-2`} disabled={prepared || busy}
                  onClick={() => { const mention = item.temporalAssistance.mentions.find((row) => row.inClaim);
                    if (!mention) return;
                    const policy = item.temporalAssistance.recommendedPolicy;
                    setClaimTimes((old) => ({ ...old, [item.chunkId]: { policy, start: mention.date,
                      end: "", verifiedOn: "", validUntil: "" } }));
                    if (supportCandidates.length === 1) { setTemporalPolicy(policy); setStartDate(mention.date); }
                  }}>추천 날짜·정책을 입력칸에 복사</button>}
              {item.temporalAssistance.mentions.length === 0 && item.temporalAssistance.unresolvedDates.length === 0 &&
                <p className="text-sm">원문 날짜 미검출·확인 필요</p>}
              {item.temporalAssistance.unresolvedDates.map((entry) =>
                <div key={entry.locator} className="text-sm"><p>원문 표기 {entry.sourceText}: {entry.reason}</p>
                  <details><summary className="cursor-pointer">미해석 날짜 위치</summary><code>{entry.locator}</code></details></div>)}
              <ul className="mt-2 space-y-2">{item.temporalAssistance.mentions.map((mention) =>
                <li key={`${mention.locator}-${mention.date}`} className="text-sm">
                  <strong>{mention.sourceText} · {meaningLabels[mention.meaning]} · {mention.inClaim ? "이 주장 안" : "문서의 다른 문맥"}</strong>
                  <p>{mention.sentence}</p>
                  {mention.hasCondition && <p>조건 표현이 함께 있습니다. 전체 문장을 확인하세요.</p>}
                  {mention.hasException && <p>예외 표현이 함께 있습니다. 제외 범위를 확인하세요.</p>}
                  <details><summary className="cursor-pointer">날짜 위치 기술 상세</summary><code className="break-all">{mention.locator}</code></details>
                </li>)}</ul>
            </section>
            {conditionCandidates.map((condition) => <section key={condition.chunkId} className="mt-3 rounded-control border border-border p-3">
              <h4 className="font-semibold">함께 검토할 필수 조건 · {condition.label}</h4>
              <p className="text-sm">이 조건도 같은 원본 판본의 별도 Chunk이며, 함께 승인·READY되지 않으면 근거로 사용할 수 없습니다.</p>
              <SourceText body={condition.body} squareParagraphGlyph />
              <details><summary className="cursor-pointer">조건 위치 기술 상세</summary><code className="break-all">{condition.locator}</code></details>
            </section>)}
            {(!review || review.status === "PENDING") && <div className="mt-4 space-y-2">
              <label className="flex gap-2"><input type="checkbox" checked={!!itemChecked[item.chunkId]}
                onChange={(event) => setItemChecked((old) => ({ ...old, [item.chunkId]: event.target.checked }))} />원문과 조건·예외를 직접 확인했습니다.</label>
              <p className="text-sm">판본 {document?.version}, 시간 근거 {temporalLabels[effectivePolicy]}, 적용 시작일 {effectiveStart || "미확인"}, 재확인 기한 {(review?.temporalValidUntil ?? selectedTime.validUntil) || "해당 없음"}</p>
              <div className="rounded-control border border-border p-3">
                <p className="text-sm">{needsCorrection ? "저장한 시간 범위가 자동 추천과 다릅니다. 정정 종류와 실제 원문 위치를 선택해야 승인할 수 있습니다." :
                  "원문에 없는 주장이나 조건·예외 누락을 발견했다면 사유를 선택하고 거절하세요."} 현재성 확인은 검토자의 확인 기록이며 자동 최신성 검증이 아닙니다.</p>
                <label>정정 종류 <select value={correction.code} onChange={(event) => updateCorrection({ code: event.target.value as ReviewCorrectionCode })}>
                  <option value="">선택하세요</option>{Object.entries(correctionLabels).map(([code, label]) =>
                    <option key={code} value={code}>{label}</option>)}</select></label>
                <label className="ml-2">근거 위치 <select value={correction.locator} onChange={(event) => updateCorrection({ locator: event.target.value })}>
                  <option value="">선택하세요</option><option value={item.locator}>이 주장 전체</option>
                  {item.temporalAssistance.mentions.filter((mention) => mention.inClaim).map((mention) =>
                    <option key={mention.locator} value={mention.locator}>{mention.date} · {meaningLabels[mention.meaning]}</option>)}
                </select></label>
              </div>
              {currentnessBlocked && <p role="status" className="text-sm">공식 URL의 현재 판본을 검증한 기록이 없어 승인할 수 없습니다.</p>}
              <button type="button" className={button} disabled={busy || !document?.storedBytesMatchHash || !itemChecked[item.chunkId] || effectivePolicy === "HOLD" || currentnessBlocked ||
                invalidForApproval || needsCorrection && (!correction.code || !correction.locator)}
                onClick={() => { if (window.confirm(`${item.label} 항목을 승인하시겠습니까? READY는 별도입니다.`))
                  void run(() => api.decideCandidate(document!.documentId, item.chunkId, document!.rawSha256, "APPROVE", canPrepare ? claimScopes() : null,
                    correction.code || null, correction.locator || null), "승인 결정과 감사 기록을 다시 조회했습니다."); }}>승인하기</button>{" "}
              <button type="button" className={button} disabled={busy || !document?.storedBytesMatchHash || !["CLAIM_OUTSIDE_SOURCE", "CONDITION_MISSING", "EXCEPTION_MISSING"].includes(correction.code)}
                onClick={() => { if (window.confirm(`${item.label} 항목은 원문 불일치·추출 오류로 사용하지 않으시겠습니까? 확인 부족은 HOLD 상태로 남겨야 합니다.`))
                  void run(() => api.decideCandidate(document!.documentId, item.chunkId, document!.rawSha256, "REJECT", canPrepare ? claimScopes() : null,
                    correction.code || null, correction.locator || null), "사용하지 않음 결정과 감사 기록을 다시 조회했습니다."); }}>사용하지 않기</button>
            </div>}
            {effectivePolicy === "HOLD" && <p className="mt-2 text-sm" role="status">원문에서 적용 시점 또는 현재 유효 범위를 확인하지 못했습니다. 공식자료의 현행성과 적용 범위를 확인하기 전에는 승인할 수 없습니다.</p>}
            <details className="mt-4"><summary className="cursor-pointer">이 항목의 결정 감사 {itemAudits.length}건</summary>
              <ul>{itemAudits.map((entry) => <li key={`${entry.reviewId}-${entry.decidedAt}`}>
                {reviewStatusLabel(entry.decision)} · {formatSeoulTime(entry.decidedAt)} (한국 시간)
                <details><summary className="cursor-pointer">감사 기술 상세</summary><code className="break-all">{entry.reviewerAccountId} · {entry.rawSha256}</code></details>
              </li>)}</ul></details>
          </article>;
        })}
      </section>
      <section className="rounded-card border border-border bg-surface p-5"><h2 className="text-xl font-bold">별도 검색 활성화</h2>
        <p className="mt-2">검색 상태: {source?.searchAvailable ? "검토된 검색 범위 사용 가능" : "READY 검증 전 또는 검색 범위 미확인"}</p>
        <p className="text-sm">승인은 검색 활성화와 다릅니다. 승인된 현재 판본만 기존 READY 근거와 함께 인덱싱합니다.</p>
        <button type="button" className={`${button} mt-3`} disabled={busy || !approved || !document || source?.searchAvailable}
          onClick={() => { if (document && window.confirm("현재 승인된 근거를 READY 검증하고 활성화하시겠습니까? 기존 READY 범위도 보존해야 합니다."))
            void run(() => api.ready(document.documentId), "READY 결과와 자료 상태를 다시 조회했습니다."); }}>
          READY 검증 및 활성화 시작</button>
        {!approved && <p className="mt-2 text-sm">모든 항목의 사람 승인과 현재 판본 확인이 필요합니다.</p>}
      </section>
    </main></div>;
}
