import type { DocumentEvidence } from "@/lib/api/document-evidence";
import { groupEvidence, officialHttpsUrl, relationIsInExcerpt } from "@/lib/financial-information/document-evidence-state.mjs";

export function EvidenceList({ evidence, metadataAlignment = "center", bulleted = false }: { evidence: DocumentEvidence[]; metadataAlignment?: "center" | "right" | "left"; bulleted?: boolean }) {
  return <div className="space-y-4">{groupEvidence(evidence).map(({ source, items }) => {
    const url = officialHttpsUrl(source.officialUrl);
    return <article key={`${source.documentId}-${source.documentVersion}-${source.officialUrl}-${source.currentApplicability}`} className="rounded-card border border-border bg-surface p-5">
      <div className={metadataAlignment === "right" ? "text-right" : metadataAlignment === "left" ? "text-left" : "text-center"}><h3 className="font-bold text-primary">{source.title}</h3>
      <p className="mt-2 text-foreground-muted">{source.organizationName}</p>
      <p className="text-foreground-muted">게시일: {source.publishedAt ?? "미확인"}</p>
      <p className="font-semibold text-foreground-muted">{source.currentApplicability === "NOT_VERIFIED" ? "현재 적용 여부 미확인" : `현재 적용 상태: ${source.currentApplicability}`}</p>
      {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary underline">공식 원문 보기</a>}</div>
      <h4 className="mt-4 text-lg font-bold text-primary">확인된 근거</h4>
      <ul className={`mt-3 space-y-5 text-left ${bulleted ? "list-disc pl-5" : "list-none"}`}>{items.map((item, index) => <li key={`${item.claimId}-${index}`}>
        <p className="whitespace-pre-wrap leading-7">{item.excerpt}</p>
        {item.related?.length > 0 && <dl className="mt-3 space-y-2">{item.related.map((part, partIndex) => <div key={`${part.role}-${partIndex}`}>
          <dt className="font-bold">{part.role === "EXCEPTION" ? "제외 및 예외" : part.role === "CONDITION" ? "적용 조건" : "관련 원문"}</dt>
          <dd className="whitespace-pre-wrap leading-7">{relationIsInExcerpt(item.excerpt, part.text)
            ? <details><summary className="cursor-pointer">위 발췌에 포함된 원문 보기</summary><p>{part.text}</p></details>
            : part.text}</dd>
        </div>)}</dl>}
      </li>)}</ul>
    </article>;
  })}</div>;
}

