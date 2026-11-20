"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { documentReviewApi, type DocumentSummary } from "@/lib/api/document-review";
import { ReviewField } from "@/components/source-review/ReviewField";
import { Toast } from "@/components/ui/Toast";
import { ApiResponseError } from "@/lib/api/errors";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState("");
  const [rights, setRights] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [changes, setChanges] = useState<Record<string, Record<string, boolean | null>>>({});
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const pending = useRef(false);
  const [notice, setNotice] = useState("");
  async function load() {
    const docs = (await documentReviewApi.documents()).filter((doc) => doc.textOnly);
    const checks = await Promise.all(docs.map(async (doc) => {
      try { const usage = (await documentReviewApi.usage(doc.documentId, doc.rawSha256))[0];
        const scopes = usage?.allowedScope.split(",") ?? [];
        const allowed = usage?.decision === "ALLOWED" && scopes.includes("SEARCH") && scopes.includes("EXCERPT");
        const claims = allowed ? await documentReviewApi.claims(doc.documentId, doc.rawSha256) : [];
        const available = [...new Set(claims.filter((claim) => claim.status === "APPROVED").map((claim) => claim.extractorVersion === "generic-claim-v3" ? "LATEST" : "LEGACY"))];
        const checkVersions = available.length ? available : doc.activeGenerationMembership ? ["REMOVAL"] : [];
        const changeEntries = await Promise.all(checkVersions.map(async (version) => {
          try { return [version, !(await documentReviewApi.unchangedBatch([doc.documentId], version === "REMOVAL" ? {} : { [doc.documentId]: version }))] as const; }
          catch { return [version, null] as const; }
        }));
        return { id: doc.documentId, allowed, available, changes: Object.fromEntries(changeEntries) };
      } catch { return { id: doc.documentId, allowed: false, available: [] as string[], changes: {} }; }
    }));
    setDocuments(docs); setRights(Object.fromEntries(checks.map((check) => [check.id, check.allowed])));
    setGroups(Object.fromEntries(checks.map((check) => [check.id, check.available])));
    setChanges(Object.fromEntries(checks.map((check) => [check.id, check.changes])));
    setVersions(Object.fromEntries(checks.filter((check) => check.available.length === 1).map((check) => [check.id, check.available[0]])));
  }
  useEffect(() => { let live = true; Promise.resolve().then(() => { if (live) return load(); }).catch(() => { if (live) setError("문서 목록을 확인할 수 없습니다. Reviewer 권한을 확인해 주세요."); }); return () => { live = false; }; }, []);
  const eligible = (documents ?? []).filter((doc) => Object.values(changes[doc.documentId] ?? {}).some(value => value === true));
  const preflightFailed = Object.values(changes).some(versions => Object.values(versions).some(value => value === null));
  const activeNeedsReview = (documents ?? []).some(doc => doc.activeGenerationMembership && (!rights[doc.documentId] || doc.approvedCount === 0 || !doc.hashMatches));
  async function activate() {
    if (!selected.length || pending.current) return;
    pending.current = true;
    setError(""); setNotice("");
    try {
      setStage("반영 대상 확인 중...");
      const selectedVersions = Object.fromEntries(selected.filter(id => versions[id]).map((id) => [id, versions[id]]));
      if (await documentReviewApi.unchangedBatch(selected, selectedVersions)) {
        setSelected([]); setNotice("이미 최신 내용이 반영되어 있습니다."); return;
      }
      const generation = await documentReviewApi.prepareBatch(selected, selectedVersions);
      setStage("검색 인덱스 생성 중..."); await documentReviewApi.buildBatch(generation);
      setStage("근거 검증 및 서비스 반영 중..."); await documentReviewApi.activateBatch(generation);
      setSelected([]); setNotice("서비스에 반영되었습니다.");
      try { await load(); } catch { setError("반영은 완료됐지만 문서 목록을 새로고침하지 못했습니다."); }
    } catch (cause) {
      const code = cause instanceof ApiResponseError ? cause.code : null;
      setError(code === "READY_NO_ELIGIBLE_CLAIMS_OR_RIGHTS"
        ? "선택한 문서에 승인된 적격 Claim이 없거나 검색·원문 발췌 이용권이 부족합니다. 문서 상세에서 확인해 주세요."
        : code === "READY_CLAIM_VERSION_REQUIRED" ? "각 문서에서 서비스에 반영할 후보 구분을 선택해 주세요."
        : code === "READY_EMPTY_CORPUS_UNSUPPORTED" ? "모든 근거를 제거하면 빈 검색 인덱스를 만들 수 없습니다. 기존 서비스는 유지됩니다."
        : code === "READY_INDEX_BUILD_FAILED" ? "검색 인덱스를 만들지 못했습니다. 기존 서비스 반영 상태는 유지됩니다."
        : code === "READY_ACTIVE_GENERATION_CHANGED" ? "다른 반영 작업이 먼저 완료됐습니다. 목록을 새로고침하고 다시 시도해 주세요."
        : code === "READY_EVIDENCE_CHANGED" ? "검증 중 Claim 승인 또는 문서 이용권이 변경됐습니다. 상태를 확인하고 다시 시도해 주세요."
        : "서비스에 반영하지 못했습니다. 승인·권리 상태가 변경됐거나 검색 인덱스를 만들지 못했습니다. 기존 반영 상태를 확인한 뒤 다시 시도해 주세요.");
    }
    finally { pending.current = false; setStage(""); }
  }
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-5 px-5 py-10">
    <header className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">공식문서 관리</h1><Link href="/official-source-review/documents/new" className="rounded-control bg-primary px-4 py-2 font-bold text-white">문서 추가</Link></header>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {documents === null && !error && <p>문서 목록을 불러오는 중...</p>}
    {documents && <p>등록된 문서 {documents.length}건</p>}
    {notice && <Toast message={notice} onClose={() => setNotice("")} />}
    <section className="rounded-card border border-border bg-surface p-5 space-y-3"><label><input type="checkbox" disabled={!!stage || eligible.length === 0} checked={eligible.length > 0 && eligible.every((doc) => selected.includes(doc.documentId))} onChange={(event) => setSelected(event.target.checked ? eligible.map((doc) => doc.documentId) : [])} /> 반영 가능한 문서 전체 선택</label><p>선택 문서 {selected.length}건</p><p>선택 문서의 승인 Claim {(documents ?? []).filter((doc) => selected.includes(doc.documentId)).reduce((sum, doc) => sum + doc.approvedCount, 0)}건 (최종 자격은 반영 중 확인)</p>{activeNeedsReview && <p role="status">기존 반영 문서의 승인 또는 이용조건을 확인해 주세요. 자격을 잃은 근거의 제거 반영은 별도 확인이 필요합니다.</p>}{documents && eligible.length === 0 && <p>{preflightFailed ? "반영 상태를 확인하지 못했습니다. 다시 불러와 주세요." : "현재 반영 가능한 Claim이 없습니다."}</p>}<button type="button" disabled={!!stage || !selected.length || selected.some((id) => changes[id]?.[versions[id] || "REMOVAL"] !== true)} onClick={() => void activate()} className="rounded-control bg-primary px-4 py-2 font-bold text-white disabled:opacity-50">{stage || "서비스 반영 (READY)"}</button></section>
    {documents?.length === 0 && <p>등록된 문서가 없습니다.</p>}
    {documents?.map((doc) => <article key={doc.documentId} className="rounded-card border border-border bg-surface p-5">
      <label className="block mb-2"><input type="checkbox" checked={selected.includes(doc.documentId)} disabled={!!stage || !eligible.some((entry) => entry.documentId === doc.documentId)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, doc.documentId] : previous.filter((id) => id !== doc.documentId))} /> 반영할 문서 선택</label>
      {(groups[doc.documentId]?.length ?? 0) > 1 && <label className="block mb-2">반영할 후보 <select className="border p-2" value={versions[doc.documentId] ?? ""} onChange={(event) => setVersions((previous) => ({ ...previous, [doc.documentId]: event.target.value }))}><option value="">선택해 주세요</option><option value="LEGACY">기존 후보</option><option value="LATEST">최신 후보</option></select></label>}
      <Link href={`/official-source-review/documents/${encodeURIComponent(doc.documentId)}`} className="text-lg font-bold text-primary underline">{doc.title}</Link>
      <div className="mt-3 space-y-2"><ReviewField label="제공 기관">{doc.platformDomain === "korea.kr" ? "금융위원회" : doc.organization}</ReviewField><ReviewField label="게시 플랫폼">{doc.platformDomain === "korea.kr" ? "대한민국 정책브리핑" : doc.organization}</ReviewField><ReviewField label="게시일">{doc.publishedAt ?? "미확인"}</ReviewField><ReviewField label="Claim 검토">승인 {doc.approvedCount}건, 검토 대기 {doc.pendingCount}건</ReviewField><ReviewField label="서비스 반영">{doc.activeGenerationMembership ? "활성 세대 포함 (현재 자격 별도 확인)" : "미반영"}</ReviewField></div>
      <p className="mt-2">{changes[doc.documentId]?.REMOVAL === true ? "기존 근거 제거를 반영할 수 있습니다." : doc.approvedCount === 0 ? "승인된 Claim이 없습니다." : !doc.hashMatches ? "문서 무결성을 확인할 수 없습니다." : !rights[doc.documentId] ? "검색 또는 원문 발췌 이용권 확인이 필요합니다." : (groups[doc.documentId] ?? []).some(version => changes[doc.documentId]?.[version] === null) ? "반영 상태를 확인하지 못했습니다. 다시 불러와 주세요." : eligible.some(entry => entry.documentId === doc.documentId) ? "반영할 변경사항이 있습니다." : "현재 반영 가능한 Claim이 없습니다."}</p>
    </article>)}
  </main></div>;
}
