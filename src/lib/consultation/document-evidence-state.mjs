import { safeOfficialLink } from "./information-links.mjs";
// Only explicitly valid backend states can expose evidence or report text.
export function visibleSnapshot(value) {
  return value?.status === "READY_CANDIDATES" && Array.isArray(value.evidence) ? value.evidence : [];
}
export function visibleReport(value) {
  return value?.status === "READY" && Array.isArray(value.evidence) ? value : null;
}
export function officialHttpsUrl(value) {
  return safeOfficialLink(value);
}

// Deduplicate only identical evidence and relations; different conditions remain separate.
export function groupEvidence(evidence) {
  const groups = new Map();
  for (const item of evidence) {
    const key = JSON.stringify([item.documentId, item.documentVersion, item.officialUrl, item.currentApplicability]);
    if (!groups.has(key)) groups.set(key, { source: item, items: [], seen: new Set() });
    const group = groups.get(key);
    const identity = JSON.stringify([item.excerpt, (item.related ?? []).map(part => [part.role, part.text])]);
    if (!group.seen.has(identity)) { group.seen.add(identity); group.items.push(item); }
  }
  return [...groups.values()].map(({ source, items }) => ({ source, items }));
}
export function relationIsInExcerpt(excerpt, text) {
  return typeof excerpt === "string" && typeof text === "string" && text.trim().length > 0 && excerpt.includes(text);
}

// Ask only when the user asks about their own eligibility and a retrieved
// claim actually contains a condition. This does not decide eligibility.
export function clarificationCondition(question, evidence) {
  if (!/(제가|저도|나는|저는|내가|신청할 수 있|받을 수 있|대상인가)/.test(question)) return null;
  return evidence.flatMap(item => item.related ?? []).find(item => item.role === "CONDITION" && item.text?.trim()
    && !question.includes(item.text.trim()))?.text ?? null;
}

// Explicit new questions are searched on their own; a referential follow-up
// may carry the earlier question, but it must still go through a fresh search.
export function followUpQuery(previous, followUp, evidence = []) {
  const text = followUp.trim();
  if (!/^(그러면|그럼|그 경우|그것|그때)/.test(text)) return text;
  const remainder = text.replace(/^(그러면|그럼|그 경우|그것|그때)\s*/, "").trim();
  const original = evidence.map(item => [item.excerpt, ...(item.related ?? []).map(part => part.text)].join(" ")).join(" ");
  const tokens = remainder.match(/[가-힣A-Za-z0-9]+/g) ?? [];
  const meaningful = tokens.filter(token => !/^(경우|경우는|무엇|어떻게|인가요|되나요)$/.test(token));
  // Do not assume that a newly mentioned product or condition belongs to the old source.
  return meaningful.length > 0 && meaningful.every(token => original.includes(token))
    ? `${previous.trim()} ${remainder}`.trim() : remainder;
}
