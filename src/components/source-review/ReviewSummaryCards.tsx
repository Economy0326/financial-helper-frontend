"use client";

export type ReviewBucket = "pending" | "approved" | "rejected";
export function ReviewSummaryCards({ items, selected, onSelect }: {
  items: { key: ReviewBucket; label: string; count: number | null }[];
  selected: ReviewBucket | null;
  onSelect: (key: ReviewBucket | null) => void;
}) {
  return <div className="grid grid-cols-3 gap-3" aria-label="검토 상태 필터">
    {items.map((item) => <button key={item.key} type="button" disabled={item.count === null}
      aria-pressed={selected === item.key} onClick={() => onSelect(selected === item.key ? null : item.key)}
      className="rounded-card border border-border bg-surface p-4 text-left disabled:opacity-50 aria-pressed:border-primary">
      <span className="block text-sm">{item.label}</span><strong className="text-2xl">{item.count ?? "—"}</strong>
    </button>)}
  </div>;
}
