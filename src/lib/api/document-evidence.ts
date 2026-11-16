import { apiFetch } from "./client";

export type RelatedEvidence = { role: string; start: number; end: number; text: string };
export type DocumentEvidence = {
  claimId: string; documentId: string; documentVersion: number; excerpt: string;
  organizationName: string; title: string; officialUrl: string; locator: string;
  publishedAt: string | null; currentApplicability: string; related: RelatedEvidence[];
};
export type EvidenceSnapshot = { snapshotId: string | null; status: string; evidence: DocumentEvidence[] };
export type EvidenceReport = {
  reportId: string; snapshotId: string; status: string; question: string | null;
  createdAt: string | null; explanation: string | null; evidence: DocumentEvidence[];
};

const root = "/information-evidence-snapshots";
export const searchDocumentEvidence = (question: string) =>
  apiFetch<EvidenceSnapshot>(root, { method: "POST", body: { question }, cache: "no-store" });
export const getEvidenceSnapshot = (id: string) =>
  apiFetch<EvidenceSnapshot>(`${root}/${encodeURIComponent(id)}`, { cache: "no-store" });
export const createEvidenceReport = (id: string, question: string) =>
  apiFetch<EvidenceReport>(`${root}/${encodeURIComponent(id)}/report`, { method: "POST", body: { question }, cache: "no-store" });
export const getEvidenceReport = (id: string) =>
  apiFetch<EvidenceReport>(`${root}/reports/${encodeURIComponent(id)}`, { cache: "no-store" });
