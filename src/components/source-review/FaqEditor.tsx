"use client";
import { useCallback, useEffect, useState } from "react";
import { listReviewerFaq, saveFaq, deleteFaq, type FaqEntry } from "@/lib/api/document-evidence";
import type { Claim } from "@/lib/api/document-review";

export function FaqEditor({ documentId, claims }: { documentId: string; claims: Claim[] }) {
  const [items,setItems]=useState<FaqEntry[]>([]); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [id,setId]=useState<string | undefined>(); const [claimId,setClaimId]=useState(""); const [question,setQuestion]=useState("");
  const [order,setOrder]=useState(0); const [published,setPublished]=useState(false); const [confirmed,setConfirmed]=useState(false); const [busy,setBusy]=useState(false);
  const refresh=useCallback(() => listReviewerFaq(documentId).then(setItems),[documentId]);
  useEffect(() => { refresh().catch(() => setError("FAQ 목록을 불러오지 못했습니다.")); },[refresh]);
  function reset() {setId(undefined);setClaimId("");setQuestion("");setOrder(0);setPublished(false);setConfirmed(false);}
  async function submit() { if(busy) return;setBusy(true);setError("");setNotice("");try {await saveFaq({claimId,question,displayOrder:order,published,meaningConfirmed:confirmed},id);await refresh();reset();setNotice("FAQ를 저장했습니다.");} catch {setError("저장하지 못했습니다. 승인과 서비스 반영, 검색 및 발췌 이용조건을 확인해 주세요.");} finally {setBusy(false);} }
  async function remove(item:FaqEntry) {if(busy || !window.confirm("이 FAQ를 삭제할까요?")) return;setBusy(true);setError("");try {await deleteFaq(item.id);await refresh();reset();setNotice("FAQ를 삭제했습니다.");} catch {setError("FAQ를 삭제하지 못했습니다.");} finally {setBusy(false);} }
  return <section className="space-y-4 rounded-card border border-border p-5"><h2 className="text-xl font-bold">자주 묻는 질문 관리</h2><p>질문이 선택한 공식 근거의 의미와 범위를 벗어나지 않는지 확인해 주세요. 공개 자격을 잃으면 자동으로 표시되지 않습니다.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status">{notice}</p>}
    {items.map(item => <div key={item.id} className="border-t border-border pt-3"><p className="font-bold">{item.question}</p><p>{item.published ? "게시" : "게시 중단"} / 순서 {item.displayOrder}</p><div className="flex gap-3"><button className="text-primary underline" disabled={busy} onClick={() => {setId(item.id);setClaimId(item.claimId ?? "");setQuestion(item.question);setOrder(item.displayOrder);setPublished(item.published);setConfirmed(false);}}>수정</button><button className="text-primary underline" disabled={busy} onClick={() => void remove(item)}>삭제</button></div></div>)}
    <label className="block font-bold">질문 제목<input className="mt-1 block w-full rounded-control border border-border p-2 font-normal" maxLength={300} value={question} onChange={e => setQuestion(e.target.value)}/></label>
    <label className="block font-bold">승인된 근거<select className="mt-1 block w-full rounded-control border border-border p-2 font-normal" value={claimId} onChange={e => {setClaimId(e.target.value);setConfirmed(false);}}><option value="">선택해 주세요</option>{claims.filter(c => c.status === "APPROVED" && !c.hold).map(c => <option key={c.candidateId} value={c.candidateId}>{c.body.slice(0,150)}</option>)}</select></label>
    {claimId && <p className="whitespace-pre-wrap">{claims.find(c => c.candidateId === claimId)?.body}</p>}
    <label className="block font-bold">표시 순서<input type="number" className="ml-2 w-24 border p-2 font-normal" value={order} onChange={e => setOrder(Number(e.target.value))}/></label>
    <label className="block"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/> 게시하기</label>
    <label className="block"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/> 질문이 선택한 원문과 조건의 의미를 벗어나지 않음을 확인했습니다.</label>
    <button className="rounded-control bg-primary px-4 py-2 font-bold text-white disabled:opacity-50" disabled={busy || !claimId || !question.trim() || !confirmed} onClick={() => void submit()}>{busy ? "저장 중..." : id ? "수정 저장" : "FAQ 추가"}</button>{id && <button className="ml-3 underline" onClick={reset}>취소</button>}
  </section>;
}
