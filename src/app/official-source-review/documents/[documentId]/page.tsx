"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { FaqEditor } from "@/components/source-review/FaqEditor";
import { Toast } from "@/components/ui/Toast";
import { ReviewField } from "@/components/source-review/ReviewField";
import { ReviewSummaryCards, type ReviewBucket } from "@/components/source-review/ReviewSummaryCards";
import { ApiResponseError } from "@/lib/api/errors";
import { documentReviewApi, type Claim, type ClaimAudit, type DocumentSummary, type UsageReview } from "@/lib/api/document-review";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";
import { nearbyReviewContext } from "@/lib/consultation/reviewer-context.mjs";

const scopes = [["STORE", "본문 저장"], ["EXTRACT", "추출"], ["REVIEW", "검토"], ["SEARCH", "검색"], ["EXCERPT", "원문 발췌"], ["EXTERNAL_AI", "외부 AI 전달"]] as const;
const button = "rounded-control border border-border px-4 py-2 font-semibold disabled:opacity-50";
const reviewTime = (value: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const decisionLabel = (value: string) => ({ APPROVED: "승인", REJECTED: "거절", REVOKED: "철회", PENDING: "검토 대기", HOLD: "보류", ALLOWED: "허용" }[value] ?? "상태 확인 필요");

export default function DocumentReviewPage() {
  const id = useParams<{ documentId: string }>().documentId;
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [history, setHistory] = useState<UsageReview[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimFilter, setClaimFilter] = useState<ReviewBucket | null>(null);
  const [versionFilter, setVersionFilter] = useState("all");
  const [audit, setAudit] = useState<ClaimAudit[]>([]);
  const [usage, setUsage] = useState("HOLD");
  const [basisUrl, setBasisUrl] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const pending = useRef(false);
  const [notice, setNotice] = useState("");
  const [change, setChange] = useState<{ checkedAt: string | null; result: string; changeDetected: boolean } | null>(null);
  const refresh = useCallback(async () => {
    const found = (await documentReviewApi.documents()).find((value) => value.documentId === id);
    if (!found) throw new Error("document unavailable");
    const [reviews, audits, observation] = await Promise.all([documentReviewApi.usage(id, found.rawSha256), documentReviewApi.audit(id, found.rawSha256), documentReviewApi.changeStatus(id)]);
    const currentClaims = reviews[0]?.decision === "ALLOWED" ? await documentReviewApi.claims(id, found.rawSha256) : [];
    setDoc(found); setHistory(reviews); setAudit(audits); setClaims(currentClaims); setChange(observation);
  }, [id]);
  useEffect(() => { const message = sessionStorage.getItem("review-toast"); if (message) { sessionStorage.removeItem("review-toast"); window.setTimeout(() => setNotice(message), 0); } }, []);
  useEffect(() => { let live = true; Promise.resolve().then(refresh).catch(() => { if (live) setError("문서를 확인할 수 없습니다. Reviewer 권한과 문서 판본을 확인해 주세요."); });
    return () => { live = false; }; }, [refresh]);
  async function act(action: () => Promise<void>, message: string, progress: string) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setBusyAction(progress); setError(""); setNotice("");
    try { await action(); await refresh(); setNotice(message); }
    catch (e) {
      try { await refresh(); } catch { setClaims([]); }
      const code = e instanceof ApiResponseError ? e.code : null;
      setError(e instanceof Error && e.message === "SOURCE_CHANGE_CHECK_FAILED" ? "공식 문서를 조회하지 못했습니다. 잠시 후 다시 확인해 주세요."
        : code === "SOURCE_USAGE_TRANSITION_INVALID" ? "범위를 줄이거나 이용조건 근거를 바꾸려면 먼저 보류로 전환해 주세요."
        : code === "SOURCE_REVIEW_NO_CANDIDATES" ? "최신 방식으로 검토할 후보를 찾지 못했습니다. 기존 후보는 유지됩니다."
        : code === "SOURCE_USAGE_SCOPE_INVALID" ? "저장·추출·검토 범위와 개인정보·제3자 권리 확인을 확인해 주세요."
        : code === "SOURCE_USAGE_STALE_DECISION" ? "다른 결정이 먼저 기록됐습니다. 현재 이용조건을 다시 확인해 주세요."
        : e instanceof ApiResponseError && e.status === 409 ? "문서나 검토 상태가 변경되어 요청을 처리하지 못했습니다. 현재 상태를 확인해 주세요."
        : "요청을 처리하거나 최신 상태를 확인하지 못했습니다. 권한과 문서 상태를 확인해 주세요.");
    }
    finally { pending.current = false; setBusy(false); setBusyAction(""); }
  }
  if (!doc || doc.documentId !== id) return <div><AppHeader /><main className="p-8">{error ? <p role="alert">{error}</p> : "문서를 확인하고 있습니다."}</main></div>;
  const link = safeOfficialLink(doc.officialUrl);
  const claimBucket = (claim: Claim): ReviewBucket => claim.status === "APPROVED" ? "approved" : claim.status === "REJECTED" ? "rejected" : "pending";
  const canSeeClaims = history[0]?.decision === "ALLOWED";
  const currentScopes = new Set((history[0]?.allowedScope?.split(",") ?? []).flatMap((scope) => scope === "STORE_EXTRACT_REVIEW" ? ["STORE", "EXTRACT", "REVIEW"] : [scope]));
  const visibleClaims = claims.filter((claim) => (!claimFilter || claimBucket(claim) === claimFilter)
    && (versionFilter === "all" || (versionFilter === "latest") === (claim.extractorVersion === "generic-claim-v3")));
  function selectClaimFilter(value: ReviewBucket | null) {
    setClaimFilter(value);
    if (value) window.setTimeout(() => document.querySelector<HTMLElement>(`[data-claim-bucket="${value}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-8 px-5 py-10">
    <Link href="/official-source-review/documents" className="inline-block text-primary underline">← 공식문서 관리로 돌아가기</Link>
    <ReviewSummaryCards selected={claimFilter} onSelect={selectClaimFilter} items={[
      { key: "pending", label: "검토 필요", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "pending").length : null },
      { key: "approved", label: "승인", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "approved").length : null },
      { key: "rejected", label: "사용 안 함", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "rejected").length : null },
    ]} />
    <header className="space-y-3"><h1 className="break-words text-3xl font-bold">{doc.title}</h1>
      <ReviewField label="제공 기관">{doc.platformDomain === "korea.kr" ? "금융위원회" : doc.organization}</ReviewField>
      <ReviewField label="게시 플랫폼">{doc.platformDomain === "korea.kr" ? "대한민국 정책브리핑" : doc.organization}</ReviewField>
      <ReviewField label="게시일">{doc.publishedAt ?? "미확인"}</ReviewField>
      <ReviewField label="현행성">현재 적용 여부 미확인</ReviewField>
      {link && <a className="text-primary underline" href={link} target="_blank" rel="noopener noreferrer">공식 원문 열기</a>}
      <p><strong>원문 변경 확인:</strong> {change?.changeDetected ? "변경이 확인되어 재검토가 필요합니다." : change?.result === "UNCHANGED" ? "본문 변경 없음" : change?.result === "FAILED" ? "조회 실패" : "아직 확인하지 않음"}</p>
      {change?.checkedAt && <p><strong>마지막 확인:</strong> {reviewTime(change.checkedAt)}</p>}
      {change?.changeDetected && <p>기존 근거의 검색과 공개가 제한됩니다. <Link className="text-primary underline" href="/official-source-review/documents/new">문서 추가</Link>에서 같은 URL을 다시 확인하고 최신 본문과 이용조건을 검토한 뒤 등록해 주세요. 새 후보는 직접 승인하고 서비스에 반영해야 합니다.</p>}
      <button disabled={busy} className={button} onClick={() => void act(async () => { const result = await documentReviewApi.checkChange(id); if (result.result === "FAILED") throw new Error("SOURCE_CHANGE_CHECK_FAILED"); }, "확인이 완료되었습니다.", "원문 확인 중...")}>{busyAction === "원문 확인 중..." ? busyAction : "원문 변경 확인"}</button>
      <p>공식 원문과 문맥, 제3자 권리를 직접 대조해 주세요.</p>
    </header>
    {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <Toast message={notice} onClose={() => setNotice("")} />}
    <FaqEditor documentId={id} claims={claims} officialUrl={link ?? ""} title={doc.title} publishedAt={doc.publishedAt} />
    <section className="space-y-3 rounded-card border border-border p-5"><h2 className="text-xl font-bold">문서 이용조건 검토</h2>
      <p>등록 시 확인한 범위와 서비스 활용 범위는 별도입니다.</p>
      {scopes.map(([value,label]) => <ReviewField key={value} label={label}>{history[0]?.decision === "ALLOWED" && currentScopes.has(value) ? "허용됨" : "허용되지 않음"}</ReviewField>)}
      {history[0] && safeOfficialLink(history[0].basisUrl) && <a className="text-primary underline" href={safeOfficialLink(history[0].basisUrl) ?? undefined} target="_blank" rel="noopener noreferrer">공식 이용조건 근거</a>}
      <details onToggle={(event) => { if (event.target === event.currentTarget && event.currentTarget.open && history[0]) { const current = history[0]; setBasisUrl(current.basisUrl); setReason(""); setUsage(current.decision); setSelected(current.allowedScope ? current.allowedScope.split(",").flatMap((scope) => scope === "STORE_EXTRACT_REVIEW" ? ["STORE", "EXTRACT", "REVIEW"] : [scope]) : []); setPrivacy(current.privacyReviewed); setThirdParty(current.thirdPartyReviewed); } }}><summary>서비스 이용 범위 확인 및 변경</summary>
      <p>이용범위 변경은 별도 결정이며 Claim 승인과 다릅니다.</p>
      {history[0]?.reason && <ReviewField label="기존 검토 사유">{history[0].reason}</ReviewField>}
      {safeOfficialLink(basisUrl) && <a href={safeOfficialLink(basisUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-primary underline">이용조건 근거 확인</a>}
      <details><summary>이용조건 근거 주소 변경</summary><label className="block">새 근거 URL <input aria-label="이용조건 근거 URL" className="block w-full border p-2" value={basisUrl} onChange={(e) => setBasisUrl(e.target.value)} /></label></details>
      <fieldset><legend>확인한 사용 범위</legend>{scopes.map(([value,label]) => <label key={value} className="mr-4 inline-block"><input type="checkbox" checked={selected.includes(value)} onChange={(e) => setSelected(e.target.checked ? [...selected,value] : selected.filter((s) => s !== value))} /> {label}</label>)}</fieldset>
      <label className="block"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> 개인정보 검토 완료</label>
      <label className="block"><input type="checkbox" checked={thirdParty} onChange={(e) => setThirdParty(e.target.checked)} /> 제3자 권리 검토 완료</label>
      <label className="block">결정 <select aria-label="이용조건 결정" className="border p-2" value={usage} onChange={(e) => setUsage(e.target.value)}><option value="ALLOWED">허용</option><option value="HOLD">보류</option><option value="REJECTED">불가</option></select></label>
      <label className="block">변경 사유 (선택) <textarea aria-label="검토 사유" className="block w-full border p-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <p>이미 허용된 범위를 줄이거나 근거 주소를 바꾸려면 먼저 보류로 전환해 주세요. 외부 AI 전달은 별도로 확인해야 합니다.</p>
      <button className={button} disabled={busy || !basisUrl.trim() || !doc.hashMatches} onClick={() => void act(async () => { await documentReviewApi.decideUsage(id, { expectedRawSha256: doc.rawSha256, documentVersion: doc.documentVersion, basisUrl, scopes: selected, privacyReviewed: privacy, thirdPartyReviewed: thirdParty, decision: usage, reason, expectedPreviousReviewId: history[0]?.id ?? null }); }, "이용조건 결정이 기록되었습니다.", "usage")}>{busyAction === "usage" ? "저장 중..." : "이용조건 결정 저장"}</button>
      {history.length > 0 && <details><summary>이용조건 결정 이력</summary>{history.map((entry) => <div key={entry.id} className="mt-2"><ReviewField label="결정">{entry.decision === "REJECTED" ? "불가" : decisionLabel(entry.decision)}</ReviewField><ReviewField label="일시">{reviewTime(entry.decidedAt)}</ReviewField><ReviewField label="사유">{entry.reason}</ReviewField><ReviewField label="허용 범위">{entry.allowedScope ? entry.allowedScope.split(",").map((value) => scopes.find(([key]) => key === value)?.[1] ?? "확인 필요").join(", ") : "없음"}</ReviewField></div>)}</details>}
      </details>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Claim 원문 검토</h2>
      {history[0]?.decision !== "ALLOWED" ? <p>이용조건을 허용하기 전에는 Claim 검토를 준비할 수 없습니다.</p> : <button className={button} disabled={busy || !doc.hashMatches} onClick={() => void act(async () => { await documentReviewApi.prepare(id, doc.rawSha256); }, "검토 후보를 확인했습니다.", "prepare")}>{busyAction === "prepare" ? "후보 확인 중..." : "Claim 검토 준비"}</button>}
      {canSeeClaims && <div className="space-y-2"><button className={button} disabled={busy || !doc.hashMatches} onClick={() => void act(async () => { await documentReviewApi.prepareLatest(id, doc.rawSha256); }, "최신 후보를 준비했습니다. 기존 결정은 유지됩니다.", "latest")}>{busyAction === "latest" ? "후보 추출 중..." : "최신 방식으로 후보 추출"}</button><p>기존 결정과 서비스 반영 상태는 유지됩니다. 새 후보는 직접 검토해야 합니다.</p><label>후보 구분 <select className="border p-2" value={versionFilter} onChange={(event) => setVersionFilter(event.target.value)}><option value="all">전체</option><option value="latest">최신 후보</option><option value="legacy">기존 후보</option></select></label></div>}
      {canSeeClaims && visibleClaims.length === 0 && <p>표시할 Claim이 없습니다.</p>}
      {visibleClaims.map((claim) => <article key={claim.candidateId} data-claim-bucket={claimBucket(claim)} className="space-y-3 rounded-card border border-border p-5">
        <ReviewField label="후보 구분">{claim.extractorVersion === "generic-claim-v3" ? "최신 후보" : "기존 후보"}</ReviewField>
        <ReviewField label="검토 상태">{claim.status === "APPROVED" ? "승인" : claim.status === "REJECTED" ? "거절" : "검토 대기"}{claim.hold ? " (안전상 승인 제한)" : ""}</ReviewField>
        <p className="whitespace-pre-wrap"><strong>근거 발췌:</strong> {claim.body}</p>{claim.body.includes("|") && <p>표 등에서 변환된 텍스트가 포함되어 있습니다. 공식 원문과 대조해 주세요.</p>}
        <details><summary className="font-semibold">앞뒤 문맥</summary>{nearbyReviewContext(claim) ? <div className="space-y-2"><ReviewField label="앞 문맥">{nearbyReviewContext(claim)?.before || "없음"}</ReviewField><ReviewField label="뒤 문맥">{nearbyReviewContext(claim)?.after || "없음"}</ReviewField><details><summary>관련 문단 보기</summary><p className="whitespace-pre-wrap">{nearbyReviewContext(claim)?.paragraph}</p></details><p>전체 문맥은 공식 원문에서 확인해 주세요. 연결된 조건과 예외는 아래에 표시됩니다.</p></div> : <p>문맥을 표시할 수 없습니다. 공식 원문을 확인해 주세요.</p>}</details>
        {claim.relations.filter((relation) => relation.role === "CONDITION" || relation.role === "EXCEPTION").map((relation, i) => claim.body.includes(relation.text) && relation.text !== claim.body
          ? <details key={`${relation.role}-${relation.start}-${i}`}><summary className="font-semibold">{relation.role === "CONDITION" ? "적용 조건" : "제외 및 예외"} (발췌에 포함){relation.ambiguous ? " · 연결 확인 필요" : ""}</summary><p className="whitespace-pre-wrap">{relation.text}</p></details>
          : <p key={`${relation.role}-${relation.start}-${i}`} className="whitespace-pre-wrap"><strong>{relation.role === "CONDITION" ? "적용 조건" : "제외 및 예외"}:</strong> {relation.text === claim.body ? "위 근거 발췌와 동일" : relation.text}{relation.ambiguous ? " (연결 확인 필요)" : ""}</p>)}
        <p><strong>검토 주의:</strong> {claim.hold ? "승인 제한. " : ""}{claim.holdReason || "별도 경고가 없더라도 공식 원문을 확인해 주세요."}</p>
        {claim.status === "PENDING" && <div className="flex gap-3"><button className={button} disabled={busy || claim.hold || !doc.hashMatches || !canSeeClaims} onClick={() => void act(() => documentReviewApi.decide(id, claim.candidateId, doc.rawSha256, "APPROVE"), "Claim 승인을 기록했습니다.", `approve:${claim.candidateId}`)}>{busyAction === `approve:${claim.candidateId}` ? "승인 중..." : "승인하기"}</button>
          <button className={button} disabled={busy || !doc.hashMatches} onClick={() => { setRejecting(claim.candidateId); setClaimReason(""); }}>사용하지 않기</button></div>}
        {claim.status === "PENDING" && rejecting === claim.candidateId && <div className="space-y-2"><label className="block">사용하지 않는 이유 (선택)<textarea className="block w-full border p-2" maxLength={1000} value={claimReason} onChange={(e) => setClaimReason(e.target.value)} /></label><div className="flex gap-2"><button className={button} disabled={busy} onClick={() => { setRejecting(null); setClaimReason(""); }}>취소</button><button className={button} disabled={busy} onClick={() => void act(async () => { await documentReviewApi.decide(id, claim.candidateId, doc.rawSha256, "REJECT", claimReason); setRejecting(null); setClaimReason(""); }, "사용하지 않기 결정을 기록했습니다.", `reject:${claim.candidateId}`)}>{busyAction === `reject:${claim.candidateId}` ? "저장 중..." : "확정"}</button></div></div>}
        {claim.status === "REJECTED" && <button className={button} disabled={busy || !doc.hashMatches} onClick={() => void act(() => documentReviewApi.reconsider(id, claim.candidateId, doc.rawSha256), "다시 검토할 수 있습니다.", `reconsider:${claim.candidateId}`)}>{busyAction === `reconsider:${claim.candidateId}` ? "처리 중..." : "다시 검토하기"}</button>}
        {claim.status === "APPROVED" && rejecting !== claim.candidateId && <button className={button} disabled={busy || !doc.hashMatches} onClick={() => { setRejecting(claim.candidateId); setClaimReason(""); }}>승인 철회</button>}
        {claim.status === "APPROVED" && rejecting === claim.candidateId && <div className="space-y-2"><label className="block">철회 사유 (선택)<textarea className="block w-full border p-2" maxLength={978} value={claimReason} onChange={(e) => setClaimReason(e.target.value)} /></label><div className="flex gap-2"><button className={button} disabled={busy} onClick={() => { setRejecting(null); setClaimReason(""); }}>취소</button><button className={button} disabled={busy} onClick={() => void act(async () => { await documentReviewApi.withdraw(id, claim.candidateId, doc.rawSha256, claimReason); setRejecting(null); setClaimReason(""); }, "승인을 철회했습니다.", `withdraw:${claim.candidateId}`)}>{busyAction === `withdraw:${claim.candidateId}` ? "철회 중..." : "확정"}</button></div></div>}
        {audit.some((entry) => entry.candidateId === claim.candidateId) && <details><summary className="font-semibold">검토 이력</summary>{audit.filter((entry) => entry.candidateId === claim.candidateId).sort((a, b) => Date.parse(a.decidedAt) - Date.parse(b.decidedAt)).map((entry, i) => <div className="mt-2" key={`${entry.decidedAt}-${i}`}><ReviewField label="결정">{entry.reason === "REJECTION_RECONSIDERED" ? "다시 검토" : decisionLabel(entry.decision)}</ReviewField><ReviewField label="일시">{reviewTime(entry.decidedAt)}</ReviewField>{entry.reason && entry.reason !== "REJECTION_RECONSIDERED" && <ReviewField label="사유">{entry.reason.replace(/^APPROVAL_WITHDRAWN:\s*/, "")}</ReviewField>}</div>)}</details>}
      </article>)}
    </section>
  </main></div>;
}
