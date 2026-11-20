"use client";
import { useCallback, useEffect, useState } from "react";
import { listFaqEligibleClaims, listReviewerFaq, saveFaq, deleteFaq, unpublishFaq, type FaqEntry } from "@/lib/api/document-evidence";
import type { Claim } from "@/lib/api/document-review";
import { safeOfficialLink } from "@/lib/financial-information/information-links.mjs";

export function FaqEditor({ documentId, claims, officialUrl, title, publishedAt }: { documentId: string; claims: Claim[]; officialUrl: string; title: string; publishedAt: string | null }) {
  const [items,setItems]=useState<FaqEntry[]>([]); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [id,setId]=useState<string | undefined>(); const [question,setQuestion]=useState("");
  const [claimIds,setClaimIds]=useState<string[]>([]); const [preview,setPreview]=useState(false);
  const [order,setOrder]=useState(""); const [published,setPublished]=useState(false); const [confirmed,setConfirmed]=useState(false); const [busy,setBusy]=useState(false);
  const [eligibleState,setEligibleState]=useState<{documentId:string; claims:Claim[]; ids:string[]} | null>(null);
  const eligibleIds = eligibleState?.documentId === documentId && eligibleState.claims === claims ? eligibleState.ids : null;
  const availableClaims = claims.filter(c => eligibleIds?.includes(c.candidateId));
  const seen = new Set<string>();
  const distinctClaims = availableClaims.filter(c => {
    const key = JSON.stringify([c.body, c.context, c.publishedAt, c.currentApplicability, c.relations.map(r => [r.role, r.text, r.ambiguous])]);
    if (seen.has(key) && !claimIds.includes(c.candidateId)) return false;
    seen.add(key); return true;
  });
  const unavailableSelection = claimIds.some(id => !availableClaims.some(c => c.candidateId === id));
  const refresh=useCallback(() => listReviewerFaq(documentId).then(setItems),[documentId]);
  useEffect(() => { let live = true; listReviewerFaq(documentId).then(value => { if (live) setItems(value); }).catch(() => { if (live) setError("FAQ 목록을 불러오지 못했습니다."); }); return () => { live = false; }; },[documentId]);
  useEffect(() => { let live = true; listFaqEligibleClaims(documentId).then(ids => { if (live) setEligibleState({documentId, claims, ids}); }).catch(() => { if (live) setError("공개 가능한 근거를 확인하지 못했습니다. 다시 불러와 주세요."); }); return () => { live = false; }; },[documentId, claims]);
  function reset() {setId(undefined);setClaimIds([]);setQuestion("");setOrder("");setPublished(false);setConfirmed(false);setPreview(false);}
  async function submit() { if(busy || !claimIds.length) return; const number = order === "" ? null : Number(order); if ((id && number === null) || (number !== null && (!Number.isSafeInteger(number) || number < 1 || number > 2147483648))) { setError("표시 순서는 1 이상의 정수로 입력해 주세요."); return; } setBusy(true);setError("");setNotice("");try {await saveFaq({claimId:claimIds[0],claimIds,question,displayOrder:number === null ? null : number - 1,published,meaningConfirmed:confirmed},id);await refresh();reset();setNotice("FAQ를 저장했습니다.");} catch {setError("저장하지 못했습니다. 승인과 서비스 반영, 검색 및 발췌 이용조건을 확인해 주세요.");} finally {setBusy(false);} }
  async function remove(item:FaqEntry) {if(busy || !window.confirm("이 FAQ를 삭제할까요?")) return;setBusy(true);setError("");try {await deleteFaq(item.id);await refresh();reset();setNotice("FAQ를 삭제했습니다.");} catch {setError("FAQ를 삭제하지 못했습니다.");} finally {setBusy(false);} }
  async function unpublish(item:FaqEntry) {if(busy) return;setBusy(true);setError("");try {await unpublishFaq(item.id);await refresh();setNotice("FAQ 게시를 중단했습니다.");} catch {setError("게시를 중단하지 못했습니다.");} finally {setBusy(false);} }
  return <section className="space-y-4"><h2 className="text-xl font-bold">자주 묻는 질문 관리</h2><div className="space-y-4 rounded-card border border-border p-5"><p>질문이 선택한 공식 근거의 의미와 범위를 벗어나지 않는지 확인해 주세요. 공개 자격을 잃으면 자동으로 표시되지 않습니다.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status">{notice}</p>}
    {items.map(item => <div key={item.id} className="border-t border-border pt-3"><p className="font-bold">{item.question}</p><p>{item.published ? "게시" : "게시 중단"} / 순서 {item.displayOrder + 1}</p><div className="flex flex-wrap gap-3"><button className="min-h-11 text-primary underline" disabled={busy} onClick={() => {setId(item.id);setClaimIds(item.claimIds?.length ? item.claimIds : item.claimId ? [item.claimId] : []);setQuestion(item.question);setOrder(String(item.displayOrder + 1));setPublished(item.published);setConfirmed(false);setPreview(false);}}>수정</button>{item.published && <button className="min-h-11 text-primary underline" disabled={busy} onClick={() => void unpublish(item)}>게시 중단</button>}<button className="min-h-11 text-primary underline" disabled={busy} onClick={() => void remove(item)}>삭제</button></div></div>)}
    <label className="block font-bold">질문 제목<input className="mt-1 block w-full rounded-control border border-border p-2 font-normal" maxLength={300} value={question} onChange={e => setQuestion(e.target.value)}/></label>
    <fieldset className="space-y-2"><legend className="font-bold">승인된 근거 선택</legend><p>현재 서비스에 반영된 근거를 최대 10개까지 선택해 주세요.</p>{eligibleIds === null && <p role="status">공개 가능한 근거를 확인하고 있습니다.</p>}{distinctClaims.map(c => <label key={c.candidateId} className="flex min-h-11 items-start gap-3 rounded-control border p-3"><input type="checkbox" className="mt-1" checked={claimIds.includes(c.candidateId)} onChange={e => {setClaimIds(prev => e.target.checked ? [...prev,c.candidateId].slice(0,10) : prev.filter(id => id !== c.candidateId));setConfirmed(false);setPreview(false);}}/><span className="min-w-0 whitespace-pre-wrap break-words">{c.body}</span></label>)}</fieldset>
    {unavailableSelection && <div role="alert" className="space-y-2 text-red-700"><p>이 화면에서 확인할 수 없는 기존 근거가 있습니다. 확인 가능한 근거를 다시 선택해 주세요.</p><button type="button" className="underline" onClick={() => {setClaimIds(ids => ids.filter(id => availableClaims.some(c => c.candidateId === id)));setConfirmed(false);}}>확인할 수 없는 근거 제외</button></div>}
    {claimIds.length > 0 && <div className="space-y-3"><button type="button" className="min-h-11 text-primary underline" onClick={() => setPreview(v => !v)}>{preview ? "미리보기 닫기" : "게시 전 미리보기"}</button>{preview && <div className="space-y-3 rounded-control bg-surface-subtle p-4"><h3 className="text-lg font-bold">{question || "질문 제목을 입력해 주세요"}</h3>{claims.filter(c => claimIds.includes(c.candidateId)).map(c => <div key={c.candidateId}><p className="whitespace-pre-wrap break-words">{c.body}</p>{c.relations.filter(r => r.role === "CONDITION" || r.role === "EXCEPTION").map((r,i) => <p key={i}><strong>{r.role === "CONDITION" ? "적용 조건" : "제외 및 예외"}:</strong> {r.text}</p>)}</div>)}<p><strong>출처:</strong> {title}</p><p><strong>게시일:</strong> {publishedAt ?? "미확인"}</p><p>현재 적용 여부는 확인되지 않았습니다.</p>{safeOfficialLink(officialUrl) && <a className="text-primary underline" href={safeOfficialLink(officialUrl) ?? undefined} target="_blank" rel="noopener noreferrer">공식 원문 확인</a>}</div>}</div>}
    <label className="block font-bold">표시 순서<input type="number" min="1" step="1" placeholder="마지막" className="ml-2 w-24 border p-2 font-normal" value={order} onChange={e => setOrder(e.target.value)}/></label><p className="text-sm">사용자 FAQ 목록에 표시되는 순서입니다. 새 FAQ는 비워 두면 마지막에 추가합니다.</p>
    <label className="block"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}/> 게시하기</label>
    <label className="block"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/> 질문이 선택한 원문과 조건의 의미를 벗어나지 않음을 확인했습니다.</label>
    <button className="min-h-11 rounded-control bg-primary px-4 py-2 font-bold text-white disabled:opacity-50" disabled={busy || unavailableSelection || !claimIds.length || !question.trim() || !confirmed} onClick={() => void submit()}>{busy ? "저장 중..." : id ? "수정 저장" : "FAQ 추가"}</button>{id && <button className="ml-3 min-h-11 underline" onClick={reset}>취소</button>}
  </div></section>;
}
