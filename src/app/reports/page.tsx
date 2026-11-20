"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { listEvidenceReports, getEvidenceReport, deleteEvidenceReport, type ReportSummary, type EvidenceReport } from "@/lib/api/document-evidence";
import { ApiResponseError } from "@/lib/api/errors";
import { useSessionQuery } from "@/lib/query/session";

function date(value: string | null) {
  return value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "미확인";
}

export default function ReportsPage() {
  const session = useSessionQuery();
  const [items, setItems] = useState<ReportSummary[] | null>(null);
  const [selected, setSelected] = useState<EvidenceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { let live = true; if (session.data?.authenticated) void listEvidenceReports().then(value => { if (live) setItems(value); }).catch(() => { if (live) setError("저장한 정보를 불러오지 못했어요."); }); return () => { live = false; }; }, [session.data?.authenticated]);
  async function open(id: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { setSelected(await getEvidenceReport(id)); } catch { setError("저장한 정보를 확인할 수 없어요. 다시 시도해 주세요."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (busy || !window.confirm("저장한 금융정보를 삭제할까요?")) return;
    setBusy(true); setError("");
    try { await deleteEvidenceReport(id); setItems(value => value?.filter(item => item.reportId !== id) ?? []); setSelected(null); setNotice("삭제했어요."); }
    catch (reason) { setError(reason instanceof ApiResponseError && reason.status === 403 ? "삭제 권한 또는 보안 확인에 실패했어요. 로그인 상태를 확인하고 다시 시도해 주세요." : "삭제하지 못했어요. 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }
  return <div><AppHeader /><main className="mx-auto max-w-3xl space-y-6 px-5 py-10">
    <h1 className="text-center text-3xl font-bold">상담 기록</h1>
    {session.isLoading ? <p role="status" className="text-center">확인 중...</p> : !session.data?.authenticated ? <p className="text-center">상담 기록은 <Link className="text-primary underline" href="/auth/login">로그인</Link> 후 볼 수 있어요.</p> : <>
      {notice && <p role="status" className="text-center text-primary">{notice}</p>}
      {error && <p role="alert" className="text-center text-danger">{error}</p>}
      {selected ? <section className="space-y-4"><h2 className="text-center text-xl font-bold">{selected.question}</h2>
        {selected.status === "STALE" ? <p className="text-center">저장 당시 근거가 변경되어 현재 정보를 표시할 수 없어요. 다시 검색해 주세요.</p> : <>{selected.status === "PARTIAL" && <p className="text-center">일부 근거가 변경되어 현재 확인 가능한 내용만 표시해요.</p>}<EvidenceList evidence={selected.evidence} metadataAlignment="right" /></>}
        <p className="text-right text-sm">저장일: {date(selected.createdAt)}</p><div className="flex justify-end"><button disabled={busy} className="rounded-control border border-border px-4 py-2" onClick={() => void remove(selected.reportId)}>{busy ? "처리 중..." : "삭제하기"}</button></div>
      </section> : !items ? <p role="status" className="text-center">불러오는 중...</p> : items.length === 0 ? <p className="text-center">저장한 상담 기록이 아직 없어요.</p> : <ul className="space-y-3">{items.map(item => <li key={item.reportId} className="border-b border-border p-4"><button disabled={busy} className="block w-full text-center font-bold text-primary underline" onClick={() => void open(item.reportId)}>{item.question}</button><p className="mt-1 text-right text-sm">저장일: {date(item.createdAt)}</p></li>)}</ul>}
    </>}
  </main></div>;
}
