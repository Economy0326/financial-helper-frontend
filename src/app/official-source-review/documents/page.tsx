"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { documentReviewApi, type DocumentSummary } from "@/lib/api/document-review";
import { ReviewSummaryCards, type ReviewBucket } from "@/components/source-review/ReviewSummaryCards";
import { sourceReviewApi, type ReviewableSource } from "@/lib/api/source-review";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<ReviewBucket | null>(null);
  const [sources, setSources] = useState<ReviewableSource[]>([]);
  const [source, setSource] = useState("");
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [basisUrl, setBasisUrl] = useState("");
  const [reason, setReason] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [storage, setStorage] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; documentReviewApi.documents().then((value) => { if (active) { setDocuments(value); setLoaded(true); } })
    .catch(() => { if (active) setError("문서 목록을 확인할 수 없습니다. Reviewer 권한을 확인해 주세요."); }); return () => { active = false; }; }, []);
  useEffect(() => { let active = true; sourceReviewApi.sources().then((items) => { if (active) setSources(items.filter((item) => item.textRegistrationAvailable)); })
    .catch(() => { if (active) setError("등록 가능한 출처를 확인할 수 없습니다."); }); return () => { active = false; }; }, []);
  async function register() {
    setBusy(true); setError("");
    try {
      const result = await documentReviewApi.registerText({ registryId: source, html, title, publishedAt: publishedAt || null,
        basisUrl, reason, privacyReviewed: privacy, thirdPartyReviewed: thirdParty, storageApproved: storage });
      setHtml(""); router.push(`/official-source-review/documents/${encodeURIComponent(result.documentId)}`);
    } catch { setError("등록하지 못했습니다. 이용조건, 본문 구조와 출처를 다시 확인해 주세요."); }
    finally { setBusy(false); }
  }
  const bucket = (doc: DocumentSummary): ReviewBucket => doc.usageDecision === "ALLOWED" ? "approved" : doc.usageDecision === "REJECTED" ? "rejected" : "pending";
  const visible = filter ? documents.filter((doc) => bucket(doc) === filter) : documents;
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-5 px-5 py-10">
    <ReviewSummaryCards selected={filter} onSelect={setFilter} items={[
      { key: "pending", label: "이용조건 확인 필요", count: loaded ? documents.filter((doc) => bucket(doc) === "pending").length : null },
      { key: "approved", label: "이용조건 허용", count: loaded ? documents.filter((doc) => bucket(doc) === "approved").length : null },
      { key: "rejected", label: "이용조건 사용 안 함", count: loaded ? documents.filter((doc) => bucket(doc) === "rejected").length : null },
    ]} />
    <h1 className="text-3xl font-bold">공식문서 공통 검토</h1><p>문서 이용조건과 Claim 내용은 별도로 검토합니다.</p>
    {error && <p role="alert">{error}</p>}
    <details className="rounded-card border border-border p-4"><summary>검토할 텍스트 등록</summary>
      <p>사전에 등록된 출처만 선택할 수 있습니다. 저장·추출·검토 권리와 개인정보·제3자 권리를 직접 확인한 경우에만 제출하세요. 검색·발췌 허용과 Claim 승인 및 READY는 별도입니다.</p>
      <p>제출 HTML의 공식 출처 일치는 자동 검증되지 않습니다. 표나 불확실한 본문은 보류됩니다.</p>
      {sources.length === 0 ? <p>등록 가능한 사전 승인 출처가 없습니다.</p> : <div className="space-y-2">
        <label className="block">출처 <select aria-label="등록 출처" className="block w-full border p-2" value={source} onChange={(e) => setSource(e.target.value)}><option value="">선택</option>{sources.map((item) => <option key={item.registryId} value={item.registryId}>{item.organization} · {item.officialUrl}</option>)}</select></label>
        <label className="block">문서 제목 <input aria-label="등록 문서 제목" className="block w-full border p-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block">게시일 <input aria-label="등록 게시일" type="date" className="border p-2" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} /></label>
        <label className="block">본문을 포함한 HTML <textarea aria-label="등록 HTML" className="block w-full border p-2" value={html} onChange={(e) => setHtml(e.target.value)} /></label>
        <label className="block">이용조건 근거 URL <input aria-label="등록 이용조건 근거" className="block w-full border p-2" value={basisUrl} onChange={(e) => setBasisUrl(e.target.value)} /></label>
        <label className="block">검토 사유 <textarea aria-label="등록 검토 사유" className="block w-full border p-2" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <label className="block"><input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} /> 저장·추출·검토 이용범위 확인</label>
        <label className="block"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> 개인정보 검토 완료</label>
        <label className="block"><input type="checkbox" checked={thirdParty} onChange={(e) => setThirdParty(e.target.checked)} /> 제3자 권리 검토 완료</label>
        <button type="button" className="rounded-control border border-border px-4 py-2 disabled:opacity-50" disabled={busy || !source || !title.trim() || !html.trim() || !basisUrl.trim() || !reason.trim() || !storage || !privacy || !thirdParty} onClick={() => void register()}>텍스트 등록</button>
      </div>}
    </details>
    {loaded && !error && visible.length === 0 && <p>표시할 문서가 없습니다.</p>}
    {visible.map((doc) => <article key={doc.documentId} className="rounded-card border border-border bg-surface p-5">
      <Link href={`/official-source-review/documents/${encodeURIComponent(doc.documentId)}`} className="text-lg font-bold text-primary underline">{doc.title}</Link>
      <p>{doc.organization} · 게시 도메인 {doc.platformDomain} · 게시일 {doc.publishedAt ?? "미확인"}</p>
      <p>판본 {doc.documentVersion} · {doc.textOnly ? "저장 텍스트" : "저장 원문"} 무결성 {doc.hashMatches ? "확인" : "불일치"}</p>
      {doc.textOnly && <p>제출 HTML의 공식 출처 일치는 미확인입니다.</p>}
      <p>이용조건 {doc.usageDecision ?? "미검토"} · 승인 {doc.approvedCount} · 미검토 {doc.pendingCount}</p>
      <p>{doc.activeGenerationMembership ? "활성 Generation에 포함된 Claim 있음" : "활성 Generation 포함 없음"}</p>
    </article>)}
    <p className="text-sm text-foreground-muted">Generation 포함 여부와 현재 검색 자격은 별개이며, 권리 상태는 검색 시 다시 검증합니다.</p>
  </main></div>;
}
