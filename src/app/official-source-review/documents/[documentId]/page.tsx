"use client";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ReviewSummaryCards, type ReviewBucket } from "@/components/source-review/ReviewSummaryCards";
import { ApiResponseError } from "@/lib/api/errors";
import { documentReviewApi, type Claim, type ClaimAudit, type DocumentSummary, type Generation, type UsageReview } from "@/lib/api/document-review";
import { sourceReviewApi, type ReviewableSource } from "@/lib/api/source-review";
import { safeOfficialLink } from "@/lib/consultation/information-links.mjs";

const scopes = [["STORE", "본문 저장"], ["EXTRACT", "추출"], ["REVIEW", "검토"], ["SEARCH", "검색"], ["EXCERPT", "원문 발췌"], ["EXTERNAL_AI", "외부 AI 전달"]] as const;
const button = "rounded-control border border-border px-4 py-2 font-semibold disabled:opacity-50";

export default function DocumentReviewPage() {
  const id = useParams<{ documentId: string }>().documentId;
  const [doc, setDoc] = useState<DocumentSummary | null>(null);
  const [history, setHistory] = useState<UsageReview[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimFilter, setClaimFilter] = useState<ReviewBucket | null>(null);
  const [audit, setAudit] = useState<ClaimAudit[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [bases, setBases] = useState<ReviewableSource[]>([]);
  const [base, setBase] = useState("");
  const [candidate, setCandidate] = useState("");
  const [usage, setUsage] = useState("HOLD");
  const [basisUrl, setBasisUrl] = useState("");
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const found = (await documentReviewApi.documents()).find((value) => value.documentId === id);
    if (!found) throw new Error("document unavailable");
    const [reviews, audits, gens] = await Promise.all([documentReviewApi.usage(id, found.rawSha256), documentReviewApi.audit(id, found.rawSha256), documentReviewApi.generations(id, found.rawSha256)]);
    const currentClaims = reviews[0]?.decision === "ALLOWED" ? await documentReviewApi.claims(id, found.rawSha256) : [];
    setDoc(found); setHistory(reviews); setAudit(audits); setGenerations(gens); setClaims(currentClaims);
  }, [id]);
  useEffect(() => { let live = true; Promise.resolve().then(refresh).catch(() => { if (live) setError("문서를 확인할 수 없습니다. Reviewer 권한과 문서 판본을 확인해 주세요."); });
    sourceReviewApi.sources().then((rows) => { if (live) setBases(rows.filter((row) => row.documentId && row.approvedItemCount > 0 && row.reviewWorkflowAvailable)); }).catch(() => {});
    return () => { live = false; }; }, [refresh]);
  async function act(action: () => Promise<void>, message: string) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); await refresh(); setNotice(message); }
    catch (e) { setClaims([]); setError(e instanceof ApiResponseError && e.status === 409 ? `변경 충돌 또는 검증 실패: ${e.code ?? "다시 확인 필요"}` : "요청을 처리하지 못했습니다. 권한과 문서 상태를 확인해 주세요."); }
    finally { setBusy(false); }
  }
  if (!doc || doc.documentId !== id) return <div><AppHeader /><main className="p-8">{error ? <p role="alert">{error}</p> : "문서를 확인하고 있습니다."}</main></div>;
  const link = safeOfficialLink(doc.officialUrl);
  const chosenBase = bases.find((value) => value.sourceKey === base);
  const claimBucket = (claim: Claim): ReviewBucket => claim.status === "APPROVED" ? "approved" : claim.status === "REJECTED" ? "rejected" : "pending";
  const canSeeClaims = history[0]?.decision === "ALLOWED";
  const visibleClaims = claimFilter ? claims.filter((claim) => claimBucket(claim) === claimFilter) : claims;
  function selectClaimFilter(value: ReviewBucket | null) {
    setClaimFilter(value);
    if (value) window.setTimeout(() => document.querySelector<HTMLElement>(`[data-claim-bucket="${value}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-8 px-5 py-10">
    <ReviewSummaryCards selected={claimFilter} onSelect={selectClaimFilter} items={[
      { key: "pending", label: "검토 필요", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "pending").length : null },
      { key: "approved", label: "승인", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "approved").length : null },
      { key: "rejected", label: "사용 안 함", count: canSeeClaims ? claims.filter((claim) => claimBucket(claim) === "rejected").length : null },
    ]} />
    <header><h1 className="text-3xl font-bold">{doc.title}</h1><p>{doc.organization} · 게시 도메인 {doc.platformDomain} · 게시일 {doc.publishedAt ?? "미확인"}</p>
      <p>판본 {doc.documentVersion} · {doc.textOnly ? "저장 텍스트" : "저장 원문"} 무결성 {doc.hashMatches ? "확인" : "불일치"} · 현재 적용 여부 미확인</p>
      {doc.textOnly && <p>제출 HTML의 공식 출처 일치는 미확인입니다. 공식 원문과 문맥을 직접 대조해 주세요.</p>}
      <p>게시 플랫폼 운영 주체와 개별 저작권자는 별도 확인이 필요합니다.</p>{link && <a className="text-primary underline" href={link} target="_blank" rel="noopener noreferrer">공식 원문 열기</a>}</header>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <section className="space-y-3 rounded-card border border-border p-5"><h2 className="text-xl font-bold">문서 이용조건 검토</h2>
      <p>현재 상태: {history[0]?.decision ?? "미검토"}. 이 결정은 개별 Claim의 내용 승인과 다릅니다.</p>
      <p>이미 허용한 이용범위를 변경하려면 HOLD로 재검토한 후 다시 결정하세요.</p>
      <label className="block">이용조건 근거 URL <input aria-label="이용조건 근거 URL" className="block w-full border p-2" value={basisUrl} onChange={(e) => setBasisUrl(e.target.value)} /></label>
      <fieldset><legend>확인한 사용 범위</legend>{scopes.map(([value,label]) => <label key={value} className="mr-4 inline-block"><input type="checkbox" checked={selected.includes(value)} onChange={(e) => setSelected(e.target.checked ? [...selected,value] : selected.filter((s) => s !== value))} /> {label}</label>)}</fieldset>
      <label className="block"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> 개인정보 검토 완료</label>
      <label className="block"><input type="checkbox" checked={thirdParty} onChange={(e) => setThirdParty(e.target.checked)} /> 제3자 권리 검토 완료</label>
      <label className="block">결정 <select aria-label="이용조건 결정" className="border p-2" value={usage} onChange={(e) => setUsage(e.target.value)}><option>HOLD</option><option>ALLOWED</option><option>REJECTED</option></select></label>
      <label className="block">검토 사유 <textarea aria-label="검토 사유" className="block w-full border p-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      <button className={button} disabled={busy || !basisUrl.trim() || !reason.trim() || !doc.hashMatches} onClick={() => void act(async () => { await documentReviewApi.decideUsage(id, { expectedRawSha256: doc.rawSha256, documentVersion: doc.documentVersion, basisUrl, scopes: selected, privacyReviewed: privacy, thirdPartyReviewed: thirdParty, decision: usage, reason, expectedPreviousReviewId: history[0]?.id ?? null }); }, "이용조건 결정이 기록되었습니다.")}>이용조건 결정 저장</button>
      <details><summary>이용조건 결정 이력</summary>{history.map((entry) => <div key={entry.id}><p>{entry.decision} · {entry.decidedAt} · 검토자 {entry.reviewerId} · {entry.reason} · 범위 {entry.allowedScope || "없음"}</p><p>개인정보 {entry.privacyReviewed ? "확인" : "미확인"} · 제3자 권리 {entry.thirdPartyReviewed ? "확인" : "미확인"}</p>{safeOfficialLink(entry.basisUrl) && <a href={safeOfficialLink(entry.basisUrl) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-primary underline">이용조건 근거 확인</a>}</div>)}</details>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Claim 원문 검토</h2>
      {history[0]?.decision !== "ALLOWED" ? <p>이용조건을 허용하기 전에는 Claim 검토를 준비할 수 없습니다.</p> : <button className={button} disabled={busy || !doc.hashMatches} onClick={() => void act(async () => { await documentReviewApi.prepare(id, doc.rawSha256); }, "검토 후보를 확인했습니다.")}>Claim 검토 준비</button>}
      {canSeeClaims && visibleClaims.length === 0 && <p>표시할 Claim이 없습니다.</p>}
      {visibleClaims.map((claim) => <article key={claim.candidateId} data-claim-bucket={claimBucket(claim)} className="space-y-3 rounded-card border border-border p-5">
        <p className="font-bold">상태 {claim.status}{claim.hold ? " · HOLD" : ""}</p><p>원문 위치 UTF-16 {claim.start}–{claim.end} · 게시일 {claim.publishedAt ?? "미확인"} · 현재 적용 여부 미확인</p>
        <p className="whitespace-pre-wrap"><strong>SUPPORT:</strong> {claim.body}</p>
        <details><summary>앞뒤 실제 문맥</summary><p className="whitespace-pre-wrap">{claim.context}</p></details>
        {!claim.relations.some((relation) => relation.role === "CONDITION") && <p>적용 조건: 별도 연결 없음 · 원문 확인 필요</p>}
        {!claim.relations.some((relation) => relation.role === "EXCEPTION") && <p>예외·제외: 별도 연결 없음 · 원문 확인 필요</p>}
        {claim.relations.map((relation, i) => <p key={`${relation.role}-${relation.start}-${i}`} className="whitespace-pre-wrap"><strong>{relation.role === "CONDITION" ? "적용 조건 · " : relation.role === "EXCEPTION" ? "예외·제외 · " : ""}{relation.role}:</strong> {relation.text}{relation.ambiguous ? " · 연결 확인 필요" : ""}</p>)}
        {claim.hold && <p>보류 이유: {claim.holdReason}</p>}
        {claim.status === "PENDING" && <div className="flex gap-3"><button className={button} disabled={busy || claim.hold || !doc.hashMatches || !canSeeClaims} onClick={() => void act(() => documentReviewApi.decide(id, claim.candidateId, doc.rawSha256, "APPROVE"), "Claim 승인을 기록했습니다.")}>승인하기</button>
          <button className={button} disabled={busy || !doc.hashMatches} onClick={() => void act(() => documentReviewApi.decide(id, claim.candidateId, doc.rawSha256, "REJECT"), "사용하지 않기 결정을 기록했습니다.")}>사용하지 않기</button></div>}
        <details><summary>Claim 감사 이력</summary>{audit.filter((entry) => entry.candidateId === claim.candidateId).map((entry, i) => <p key={`${entry.decidedAt}-${i}`}>{entry.decision} · {entry.decidedAt} · 검토자 {entry.reviewerId} · {entry.reason}</p>)}</details>
      </article>)}
    </section>
    <section className="space-y-3 rounded-card border border-border p-5"><h2 className="text-xl font-bold">READY Generation</h2>
      <p>Claim 승인과 검색 활성화는 별도입니다. Generation 포함 여부는 현재 검색 가능성을 보장하지 않습니다.</p>
      {generations.map((g) => <p key={g.generationId}>후보 {g.generationId} · Generation {g.status} · 빌드 {g.buildStatus ?? "미시작"} · {g.active ? "활성 포인터" : "비활성"}{g.buildStatus === "FAILED" ? " · 빌드 실패, 재검토 필요" : ""}</p>)}
      <label className="block">기존 승인 근거를 보존할 기준 문서 <select aria-label="기준 문서" className="block w-full border p-2" value={base} onChange={(e) => { setBase(e.target.value); setCandidate(""); }}><option value="">선택</option>{bases.map((value) => <option key={value.sourceKey} value={value.sourceKey}>{value.title ?? value.sourceKey}</option>)}</select></label>
      <p className="text-sm">기존 승인 문서와 이 문서의 승인 Claim을 결합합니다. 실제 시연 환경의 혼합 활성화 제한은 유지됩니다.</p>
      <div className="flex flex-wrap gap-2"><button className={button} disabled={busy || !chosenBase?.documentId || history[0]?.decision !== "ALLOWED" || doc.approvedCount === 0 || !doc.hashMatches} onClick={() => void act(async () => { if (chosenBase?.documentId) setCandidate(await documentReviewApi.candidate(chosenBase.sourceKey, chosenBase.documentId, id)); }, "비활성 READY 후보를 만들었습니다.")}>READY 후보 생성</button>
        <button className={button} disabled={busy || !base || !candidate || history[0]?.decision !== "ALLOWED" || !doc.hashMatches} onClick={() => void act(() => documentReviewApi.generationAction(base, candidate, "build"), "후보 빌드를 마쳤습니다.")}>후보 빌드</button>
        <button className={button} disabled={busy || !base || !candidate || history[0]?.decision !== "ALLOWED" || !doc.hashMatches || !generations.some((g) => g.generationId === candidate && g.status === "READY" && !g.active)} onClick={() => void act(() => documentReviewApi.generationAction(base, candidate, "activate"), "활성화 요청을 처리했습니다.")}>활성화 요청</button></div>
      {candidate && <p>이번 요청의 후보: {candidate}</p>}
    </section>
  </main></div>;
}
