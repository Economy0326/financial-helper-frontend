"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { listFaq, type FaqEntry } from "@/lib/api/document-evidence";

export default function FaqPage() {
  const [items,setItems] = useState<FaqEntry[] | null>(null);
  const [error,setError] = useState(false);
  useEffect(() => { let live=true; listFaq().then(v => { if(live) setItems(v); }).catch(() => { if(live) setError(true); }); return () => { live=false; }; }, []);
  return <div><AppHeader/><main className="mx-auto max-w-3xl space-y-5 px-5 py-10">
    <Link href="/" className="inline-flex min-h-11 items-center text-primary underline">← 홈으로</Link><h1 className="text-3xl font-bold">자주 묻는 질문</h1><p>공식문서에 근거한 답변입니다. 게시일과 현재 적용 여부를 함께 확인해 주세요.</p>
    {error ? <p role="alert" className="text-red-700">질문을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : !items ? <p>불러오는 중...</p> : items.length === 0 ? <p>아직 게시된 질문이 없습니다.</p> : items.map(item => <details key={item.id} className="rounded-card border border-border p-5"><summary className="cursor-pointer text-lg font-bold">{item.question}</summary><div className="mt-4"><EvidenceList evidence={item.evidence}/></div></details>)}
  </main></div>;
}
