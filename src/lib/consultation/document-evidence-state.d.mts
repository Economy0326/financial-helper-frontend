import type { DocumentEvidence, EvidenceReport, EvidenceSnapshot } from "../api/document-evidence";
export function visibleSnapshot(value: EvidenceSnapshot | null): DocumentEvidence[];
export function visibleReport(value: EvidenceReport | null): EvidenceReport | null;
export function officialHttpsUrl(value: string): string | null;
