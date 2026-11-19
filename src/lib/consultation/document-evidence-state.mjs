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
