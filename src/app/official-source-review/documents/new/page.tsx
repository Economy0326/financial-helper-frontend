"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { ReviewField } from "@/components/source-review/ReviewField";
import { documentReviewApi } from "@/lib/api/document-review";

import { ApiResponseError } from "@/lib/api/errors";

export default function AddDocumentPage() {
  const router = useRouter();

  const [error, setError] = useState("");


  const [source, setSource] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [preview, setPreview] = useState<{ title: string; publishedAt: string | null; officialUrl: string; licenseType: string; previewSha256: string | null } | null>(null);
  const [basisUrl, setBasisUrl] = useState("");
  const [reason, setReason] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [storage, setStorage] = useState(false);
  const [busy, setBusy] = useState(false);
  async function registerSource() {
    setBusy(true); setError("");
    try {
      const result = await documentReviewApi.registerSource({ registryId: source, basisUrl, reason,
        privacyReviewed: privacy, thirdPartyReviewed: thirdParty, storageApproved: storage, requireTypeOne: true, expectedPreviewSha256: preview?.previewSha256 ?? undefined });
      sessionStorage.setItem("review-toast", "문서가 등록되었습니다.");
      router.push(`/official-source-review/documents/${encodeURIComponent(result.documentId)}`);
    } catch (cause) {
      const code = cause instanceof ApiResponseError ? cause.code : null;
      setError(code === "SOURCE_TEXT_CONTENT_REVIEW_REQUIRED" ? "표, 인용 또는 개인정보 검토가 필요한 문서라 자동 등록할 수 없습니다."
        : code === "SOURCE_TEXT_NO_REVIEWABLE_CLAIMS" ? "검토할 수 있는 Claim 후보가 없어 문서를 등록하지 않았습니다."
        : code === "SOURCE_TEXT_LICENSE_UNVERIFIED" ? "문서의 이용조건 표시가 변경되었거나 확인되지 않습니다. 다시 확인해 주세요."
        : code === "SOURCE_TEXT_PREVIEW_CHANGED" ? "문서 내용이 변경됐습니다. 문서 확인부터 다시 진행해 주세요."
        : code === "SOURCE_TEXT_SELECTOR_AMBIGUOUS" ? "공식 본문 위치를 확인하지 못했습니다."
        : code === "SOURCE_ERROR_PAGE" ? "공식 사이트가 로그인 또는 오류 페이지를 반환하여 등록을 중단했습니다."
        : code === "SOURCE_REGISTRY_CHANGED" ? "출처 설정이 변경됐습니다. 다시 확인해 주세요."
        : "공식 문서를 가져오거나 등록하지 못했습니다. 출처와 이용조건을 확인해 주세요.");
    } finally { setBusy(false); }
  }
  async function addCandidate() {
    setBusy(true); setError(""); setPreview(null); setStorage(false); setPrivacy(false); setThirdParty(false);
    try {
      const candidate = await documentReviewApi.addCandidate(newUrl.trim());
      if (candidate.documentId) { router.push(`/official-source-review/documents/${encodeURIComponent(candidate.documentId)}`); return; }
      const metadata = await documentReviewApi.previewCandidate(candidate.registryId);
      setSource(candidate.registryId); setPreview(metadata);
      if (metadata.licenseType === "PUBLIC_NURI_TYPE_1_TEXT") {
        setBasisUrl(metadata.officialUrl);
        setReason("기사에 표시된 텍스트 공공누리 제1유형과 제외 범위를 검토함");
      } else { setBasisUrl(""); setReason(""); }
    } catch { setError("공식 URL을 추가하지 못했습니다. 허용된 기관과 URL을 확인해 주세요."); }
    finally { setBusy(false); }
  }
  return <div className="min-h-dvh bg-background"><AppHeader /><main className="mx-auto max-w-4xl space-y-5 px-5 py-10">
    <Link href="/official-source-review/documents" className="inline-block text-primary underline">← 공식문서 관리로 돌아가기</Link>
    <h1 className="text-3xl font-bold">공식문서 추가</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <section className="rounded-card border border-border p-4">
      <div className="space-y-2">
        <p>출처: 금융위원회 또는 금융위원회가 표시된 대한민국 정책브리핑 정책뉴스</p>
        <label className="block">공식 문서 URL <input aria-label="공식 문서 URL" type="url" disabled={busy} className="block w-full border p-2" value={newUrl} onChange={(e) => { setNewUrl(e.target.value); setSource(""); setPreview(null); setStorage(false); setPrivacy(false); setThirdParty(false); }} /></label>
        <button type="button" disabled={busy || !newUrl.trim()} className="rounded-control border px-4 py-2 disabled:opacity-50" onClick={() => void addCandidate()}>{busy ? "문서 확인 중..." : "문서 확인"}</button>
        <p className="text-sm">URL 추가는 검토 후보만 만듭니다. 원문 저장과 이용권·Claim 승인은 별도입니다.</p>
        {preview && <><div className="space-y-2"><ReviewField label="제목">{preview.title}</ReviewField><ReviewField label="제공 기관">금융위원회</ReviewField><ReviewField label="게시 플랫폼">{new URL(preview.officialUrl).hostname === "www.korea.kr" ? "대한민국 정책브리핑" : "금융위원회"}</ReviewField><ReviewField label="게시일">{preview.publishedAt ?? "미확인"}</ReviewField><a className="text-primary underline" href={preview.officialUrl} target="_blank" rel="noopener noreferrer">공식 원문 및 이용조건 확인</a>{preview.licenseType === "PUBLIC_NURI_TYPE_1_TEXT" ? <><ReviewField label="이용 유형">공공누리 제1유형</ReviewField><ReviewField label="이용 범위">기사 텍스트</ReviewField><ReviewField label="이용 조건">출처 표시</ReviewField><ReviewField label="제외 대상">식별 가능한 사진, 캡션, 인용 및 연락처. 개인정보와 제3자 권리는 원문을 직접 검토해 주세요.</ReviewField><ReviewField label="외부 AI 전달">허용되지 않음</ReviewField></> : <p className="text-red-700" role="alert">문서에 표시된 지원 이용조건을 확인하지 못해 등록할 수 없습니다.</p>}</div>
        <p>이용조건 및 제외 범위를 확인한 후 문서를 등록해 주세요.</p>
        <label className="block"><input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} /> 저장·추출·검토 이용범위 확인</label>
        <label className="block"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> 개인정보 검토 완료</label>
        <label className="block"><input type="checkbox" checked={thirdParty} onChange={(e) => setThirdParty(e.target.checked)} /> 제3자 권리 검토 완료</label>
        <button type="button" className="rounded-control border border-border px-4 py-2 disabled:opacity-50" disabled={busy || preview.licenseType !== "PUBLIC_NURI_TYPE_1_TEXT" || !source || !basisUrl.trim() || !reason.trim() || !storage || !privacy || !thirdParty} onClick={() => void registerSource()}>{busy ? "문서 등록 중..." : "문서 등록 및 Claim 추출"}</button></>}
      </div>
    </section>
  </main></div>;
}
