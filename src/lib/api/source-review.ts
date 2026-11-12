import { apiFetch } from "./client";

const base = "/source-review/deposit";

export type ReviewDocument = {
  documentId: string;
  documentVersion: number;
  rawSha256: string;
  title: string;
  publishedAt: string;
  pdfUrl: string;
  metadataSourceUrl: string;
  retrievedAt: string;
  storedBytesMatchHash: boolean;
  matchesReviewedHash: boolean;
  verifiedAt: string;
};

export type ReviewableSource = {
  sourceKey: string;
  organization: string;
  officialUrl: string;
  format: string;
  documentId: string | null;
  title: string | null;
  publishedAt: string | null;
  documentVersion: number | null;
  rawSha256: string | null;
  reviewWorkflowAvailable: boolean;
  reviewItemCount: number;
  approvedItemCount: number;
  pendingItemCount: number;
  rejectedItemCount: number;
  searchAvailable: boolean;
};

export type ReviewCandidate = {
  question: number;
  supportChunkId: string;
  pageReference: string;
  locator: string;
  body: string;
  mandatoryContextPassages: string[];
};

export type ReviewState = {
  reviewId: string;
  question: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  rawSha256: string;
  applicabilityStartDate: string;
  applicabilityEndDate: string | null;
  reviewedAt: string | null;
  revokedAt: string | null;
};

export type ReviewAudit = {
  reviewId: string;
  question: number;
  reviewerAccountId: string;
  decision: string;
  reason: string;
  decidedAt: string;
  rawSha256: string;
};

export const sourceReviewApi = {
  sources: () => apiFetch<ReviewableSource[]>(`${base}/sources`),
  document: () => apiFetch<ReviewDocument>(`${base}/document`),
  ingest: async () => {
    const result = await apiFetch<{ outcome: string; failureCode: string | null }>(
      `${base}/ingest`, { method: "POST" });
    if (result.outcome === "FAILED") throw new Error("공식 PDF 수집에 실패했습니다.");
    return result;
  },
  candidates: (documentId: string) =>
    apiFetch<ReviewCandidate[]>(`${base}/candidates?documentId=${encodeURIComponent(documentId)}`),
  chunk: (documentId: string) =>
    apiFetch<ReviewCandidate[]>(`${base}/chunk?documentId=${encodeURIComponent(documentId)}`, { method: "POST" }),
  reviews: (documentId: string) =>
    apiFetch<ReviewState[]>(`${base}/reviews?documentId=${encodeURIComponent(documentId)}`),
  audit: (documentId: string) =>
    apiFetch<ReviewAudit[]>(`${base}/audit?documentId=${encodeURIComponent(documentId)}`),
  prepare: (documentId: string, start: string, end: string | null) =>
    apiFetch<unknown>(`${base}/prepare`, {
      method: "POST",
      body: { documentId, applicabilityStartDate: start, applicabilityEndDate: end },
    }),
  decide: (reviewId: string, rawSha256: string, decision: "APPROVE" | "REJECT") =>
    apiFetch<void>(`${base}/${encodeURIComponent(reviewId)}/decision`, {
      method: "POST",
      body: { expectedRawSha256: rawSha256, conditionsReviewed: decision === "APPROVE",
        exceptionsReviewed: decision === "APPROVE", decision },
    }),
  ready: (documentId: string) => apiFetch<string>(
    `${base}/ready?documentId=${encodeURIComponent(documentId)}`, { method: "POST" }),
};
