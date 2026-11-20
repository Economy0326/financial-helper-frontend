"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { EvidenceList } from "@/components/financial-information/DocumentEvidenceList";
import { listFaq, type FaqEntry } from "@/lib/api/document-evidence";

export default function FaqDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<FaqEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { let live = true; listFaq().then(value => { if (live) setItems(value); }).catch(() => { if (live) setError(true); }); return () => { live = false; }; }, []);
  const item = items?.find(value => value.id === id);
  return <div><AppHeader /><main className="mx-auto max-w-3xl px-5 pb-10 pt-2 sm:pt-4 space-y-4">
    {error ? <p role="alert" className="text-center">질문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p> : !items ? <p role="status" className="text-center">불러오는 중...</p> : !item ? <p className="text-center">현재 확인할 수 없는 질문이에요.</p> : <><h1 className="text-center text-2xl font-bold">{item.question}</h1><EvidenceList evidence={item.evidence} metadataAlignment="left" bulleted /></>}
  </main></div>;
}
