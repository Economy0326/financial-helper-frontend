import type { DocumentEvidence, EvidenceReport, EvidenceSnapshot } from "../api/document-evidence";
export function visibleSnapshot(value: EvidenceSnapshot | null): DocumentEvidence[];
export function visibleReport(value: EvidenceReport | null): EvidenceReport | null;
export function officialHttpsUrl(value: string): string | null;
export function clarificationCondition(question: string, evidence: DocumentEvidence[]): string | null;
export function groupEvidence(evidence: DocumentEvidence[]): { source: DocumentEvidence; items: DocumentEvidence[] }[];
export function relationIsInExcerpt(excerpt: string, text: string): boolean;
