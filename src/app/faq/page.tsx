"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { listFaq, type FaqEntry } from "@/lib/api/document-evidence";

export default function FaqPage() {
  const [items, setItems] = useState<FaqEntry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { let live = true; listFaq().then(value => { if (live) setItems(value); }).catch(() => { if (live) setError(true); }); return () => { live = false; }; }, []);
  return <div><AppHeader /><main className="mx-auto max-w-3xl px-5 pb-10 pt-2 sm:pt-4 space-y-4 text-center">
    <h1 className="text-3xl font-bold">자주 묻는 질문</h1>
    {error ? <p role="alert">질문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p> : !items ? <p role="status">불러오는 중...</p> : items.length === 0 ? <p>아직 게시된 질문이 없어요.</p> : <ul className="space-y-1 text-left">{items.map(item => <li key={item.id}><Link className="inline-flex min-h-11 items-center font-semibold text-primary underline" href={`/faq/${encodeURIComponent(item.id)}`}>• {item.question}</Link></li>)}</ul>}
  </main></div>;
}
