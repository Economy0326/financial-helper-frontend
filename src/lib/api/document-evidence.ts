import { apiFetch } from "./client";

export type RelatedEvidence = { role: string; start: number; end: number; text: string };
export type DocumentEvidence = {
  claimId: string; documentId: string; documentVersion: number; excerpt: string;
  organizationName: string; title: string; officialUrl: string; locator: string;
  publishedAt: string | null; currentApplicability: string; related: RelatedEvidence[];
};
export type ClarificationOption = { label: string; title: string; purpose: string | null };
export type ClarificationSelection = { title: string; purpose?: string | null; excerpt?: string };
export type EvidenceSnapshot = { snapshotId: string | null; status: string; evidence: DocumentEvidence[]; missingPurposes?: string[]; options?: ClarificationOption[] };
export type EvidenceExplanation = { status: "AI_EXPLANATION" | "AI_SOURCE_BOUND" | "FALLBACK" | "STALE"; explanation: string | null; reason?: string | null };
export type ExplanationQuota = { remaining: number; limit: number; resetsAt: string; available: boolean; reason?: string };
export type EvidenceReport = {
  reportId: string; snapshotId: string; status: string; question: string | null;
  createdAt: string | null; explanation: string | null; evidence: DocumentEvidence[];
};

const root = "/information-evidence-snapshots";
export const getInformationTopics = () => apiFetch<string[]>(`${root}/topics`, { cache: "no-store" });
export const searchDocumentEvidence = (question: string, selection?: ClarificationSelection) =>
  apiFetch<EvidenceSnapshot>(root, { method: "POST", body: selection ? { question, selection } : { question }, cache: "no-store" });
export const getEvidenceSnapshot = (id: string) =>
  apiFetch<EvidenceSnapshot>(`${root}/${encodeURIComponent(id)}`, { cache: "no-store" });
export const explainDocumentEvidence = (id: string, requestId: string, question: string) =>
  apiFetch<EvidenceExplanation>(`${root}/${encodeURIComponent(id)}/explanation`, { method: "POST", body: { requestId, question }, cache: "no-store" });
export const getExplanationQuota = (snapshotId?: string) => apiFetch<ExplanationQuota>(`${root}/explanation-quota${snapshotId ? `?snapshotId=${encodeURIComponent(snapshotId)}` : ""}`, { cache: "no-store" });
export const createEvidenceReport = (id: string, question: string) =>
  apiFetch<EvidenceReport>(`${root}/${encodeURIComponent(id)}/report`, { method: "POST", body: { question }, cache: "no-store" });
export const getEvidenceReport = (id: string) =>
  apiFetch<EvidenceReport>(`${root}/reports/${encodeURIComponent(id)}`, { cache: "no-store" });
export type ReportSummary = { reportId: string; question: string; createdAt: string };
export const listEvidenceReports = () => apiFetch<ReportSummary[]>(`${root}/reports`, { cache: "no-store" });
export const deleteEvidenceReport = (id: string) => apiFetch<void>(`${root}/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
export type FaqEntry = { id: string; claimId: string | null; claimIds: string[]; question: string; displayOrder: number; published: boolean; evidence: DocumentEvidence[] };
export type FaqInput = { claimId: string; claimIds?: string[]; question: string; displayOrder: number | null; published: boolean; meaningConfirmed: boolean };
export const listFaq = () => apiFetch<FaqEntry[]>("/faq", { cache: "no-store" });
export const listReviewerFaq = (documentId: string) => apiFetch<FaqEntry[]>(`/source-review/faq?documentId=${encodeURIComponent(documentId)}`, { cache: "no-store" });
export const listFaqEligibleClaims = (documentId: string) => apiFetch<string[]>(`/source-review/faq/eligible-claims?documentId=${encodeURIComponent(documentId)}`, { cache: "no-store" });
export const saveFaq = (value: FaqInput, id?: string) => apiFetch<FaqEntry>(`/source-review/faq${id ? `/${encodeURIComponent(id)}` : ""}`, { method: id ? "PUT" : "POST", body: value });
export const deleteFaq = (id: string) => apiFetch<void>(`/source-review/faq/${encodeURIComponent(id)}`, { method: "DELETE" });
export const unpublishFaq = (id: string) => apiFetch<void>(`/source-review/faq/${encodeURIComponent(id)}/unpublish`, { method: "POST" });
