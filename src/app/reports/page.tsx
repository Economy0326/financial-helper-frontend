"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { listEvidenceReports, getEvidenceReport, deleteEvidenceReport, type ReportSummary, type EvidenceReport } from "@/lib/api/document-evidence";
import { useSessionQuery } from "@/lib/query/session";

export default function ReportsPage() {
  const session=useSessionQuery();
  const [items,setItems]=useState<ReportSummary[] | null>(null);
  const [selected,setSelected]=useState<EvidenceReport | null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  useEffect(() => { if(session.data?.authenticated) listEvidenceReports().then(setItems).catch(() => setError("저장한 정보를 불러오지 못했습니다.")); },[session.data?.authenticated]);
  async function open(id:string) { setBusy(true);setError("");try {setSelected(await getEvidenceReport(id));} catch {setError("저장한 정보를 확인할 수 없습니다.");} finally {setBusy(false);} }
  async function remove(id:string) { if (!window.confirm("저장한 금융정보를 삭제할까요?")) return; setBusy(true);setError(""); try {await deleteEvidenceReport(id);setItems(v => v?.filter(i => i.reportId !== id) ?? []);setSelected(null);} catch {setError("삭제하지 못했습니다. 다시 시도해 주세요.");} finally {setBusy(false);} }
  return <div><AppHeader/><main className="mx-auto max-w-3xl space-y-5 px-5 py-10"><Link href="/" className="text-primary underline">← 홈으로</Link><h1 className="text-3xl font-bold">내 금융정보</h1>
    {session.isLoading ? <p>확인 중...</p> : !session.data?.authenticated ? <p>저장한 금융정보는 <Link className="text-primary underline" href="/auth/login">로그인</Link> 후 볼 수 있습니다.</p> : <>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {selected ? <section className="space-y-4"><button className="text-primary underline" onClick={() => setSelected(null)}>← 목록으로 돌아가기</button><h2 className="text-xl font-bold">{selected.question}</h2><p>저장일: {selected.createdAt ? new Date(selected.createdAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"}) : "미확인"}</p>
      {selected.status === "STALE" ? <p>저장 당시 근거가 변경되어 현재 정보를 표시할 수 없습니다. 다시 검색해 주세요.</p> : <>{selected.status === "PARTIAL" && <p>일부 근거가 변경되어 현재 확인 가능한 내용만 표시합니다.</p>}<EvidenceList evidence={selected.evidence}/></>}
      <button disabled={busy} className="rounded-control border border-border px-4 py-2" onClick={() => void remove(selected.reportId)}>{busy ? "처리 중..." : "삭제하기"}</button></section> : !items ? <p>불러오는 중...</p> : items.length === 0 ? <p>저장한 금융정보가 아직 없습니다.</p> : <ul className="space-y-3">{items.map(item => <li key={item.reportId} className="rounded-card border border-border p-4"><button disabled={busy} className="text-left font-bold text-primary underline" onClick={() => void open(item.reportId)}>{item.question}</button><p className="mt-1 text-sm">저장일: {new Date(item.createdAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})}</p></li>)}</ul>}</>}
    <Link href="/financial-information" className="inline-block text-primary underline">종료하고 새로운 질문 시작하기</Link>
  </main></div>;
}
