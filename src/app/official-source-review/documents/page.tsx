"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { documentReviewApi, type DocumentSummary } from "@/lib/api/document-review";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; documentReviewApi.documents().then((value) => { if (active) setDocuments(value); })
    .catch(() => { if (active) setError("문서 목록을 확인할 수 없습니다. Reviewer 권한을 확인해 주세요."); }); return () => { active = false; }; }, []);
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-5 px-5 py-10">
    <h1 className="text-3xl font-bold">공식문서 공통 검토</h1><p>문서 이용조건과 Claim 내용은 별도로 검토합니다.</p>
    {error && <p role="alert">{error}</p>}
    {documents.map((doc) => <article key={doc.documentId} className="rounded-card border border-border bg-surface p-5">
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
