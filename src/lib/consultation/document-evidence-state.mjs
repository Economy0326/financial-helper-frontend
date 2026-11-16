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
