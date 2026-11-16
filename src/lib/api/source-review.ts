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
  registryId: string;
  textRegistrationAvailable: boolean;
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
  candidateItemCount: number;
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
  decideCandidate: (documentId: string, question: number, rawSha256: string,
      start: string, end: string | null, decision: "APPROVE" | "REJECT") =>
    apiFetch<void>(`${base}/candidate-decision`, { method: "POST", body: {
      documentId, question, expectedRawSha256: rawSha256, applicabilityStartDate: start,
      applicabilityEndDate: end, conditionsReviewed: decision === "APPROVE",
      exceptionsReviewed: decision === "APPROVE", decision,
    } }),
  ready: (documentId: string) => apiFetch<string>(
    `${base}/ready?documentId=${encodeURIComponent(documentId)}`, { method: "POST" }),
};

export type InformationReviewDocument = {
  documentId: string; version: number; title: string; publishedAt: string | null;
  rawSha256: string; officialUrl: string; retrievedAt: string;
  storedBytesMatchHash: boolean;
};
export type InformationReviewCandidate = {
  chunkId: string; label: string; body: string; locator: string;
  article: string | null; page: string | null; status: string; role: "SUPPORT" | "CONDITION" | "EXCEPTION";
  temporalAssistance: {
    documentPublishedAt: string | null; recommendedPolicy: TemporalEvidencePolicy;
    reason: string; truncated: boolean; currentnessNotice: string;
    unresolvedDates: { sourceText: string; locator: string; reason: string }[];
    mentions: { date: string; sourceText: string;
      meaning: "PUBLICATION" | "AMENDMENT" | "EFFECTIVE" | "LAW_EFFECTIVE" | "CONTRACT" | "HISTORICAL" | "UNCLEAR";
      sentence: string; locator: string; inClaim: boolean; hasCondition: boolean; hasException: boolean }[];
  };
};
export type InformationReviewState = {
  reviewId: string; chunkId: string; status: string; rawSha256: string;
  start: string | null; end: string | null; reviewedAt: string | null; revokedAt: string | null;
  temporalPolicy: TemporalEvidencePolicy;
  temporalVerifiedOn: string | null; temporalValidUntil: string | null;
  temporalState: "HOLD" | "REVOKED" | "RECHECK_REQUIRED" | "REVIEW_REQUIRED" |
    "EFFECTIVE_WINDOW_REVIEWED" | "REVIEWER_CHECK_WINDOW";
};
export type TemporalEvidencePolicy = "EXPLICIT_EFFECTIVE" | "VERSION_EFFECTIVE" | "CURRENT_GUIDANCE"
  | "HISTORICAL_FACT" | "CONTRACT_DATE" | "DYNAMIC_CHECK" | "HOLD";
export type InformationClaimScope = { chunkId: string; policy: TemporalEvidencePolicy;
  start: string | null; end: string | null; verifiedOn: string | null; validUntil: string | null };
export type InformationReviewAudit = {
  reviewId: string; reviewerAccountId: string; decision: string;
  reason: string; decidedAt: string; rawSha256: string;
};
export type ReviewCorrectionCode = "SOURCE_DATE_MISCLASSIFIED" | "SOURCE_CONTEXT_MISSING" |
  "REVIEWER_CURRENTNESS_CHECK" | "CLAIM_OUTSIDE_SOURCE" | "CONDITION_MISSING" |
  "EXCEPTION_MISSING" | "OTHER_SCOPE";
export type InformationReviewGuide = {
  location: string; support: string; condition: string; exception: string;
  hold: string; dateNote: string;
};

export function informationReviewApi(sourceKey: string) {
  const path = `/source-review/information/${encodeURIComponent(sourceKey)}`;
  return {
    guidance: () => apiFetch<InformationReviewGuide>(`${path}/guidance`),
    document: () => apiFetch<InformationReviewDocument>(`${path}/document`),
    ingest: () => apiFetch<{ outcome: string; failureCode: string | null }>(`${path}/ingest`, { method: "POST" }),
    extract: (documentId: string) => apiFetch<InformationReviewCandidate[]>(
      `${path}/extract?documentId=${encodeURIComponent(documentId)}`, { method: "POST" }),
    candidates: (documentId: string) => apiFetch<InformationReviewCandidate[]>(
      `${path}/candidates?documentId=${encodeURIComponent(documentId)}`),
    reviews: (documentId: string) => apiFetch<InformationReviewState[]>(
      `${path}/reviews?documentId=${encodeURIComponent(documentId)}`),
    audit: (documentId: string) => apiFetch<InformationReviewAudit[]>(
      `${path}/audit?documentId=${encodeURIComponent(documentId)}`),
    prepare: (documentId: string, rawSha256: string, start: string | null, end: string | null,
      temporalPolicy: TemporalEvidencePolicy, temporalVerifiedOn: string | null, temporalValidUntil: string | null,
      claimScopes?: InformationClaimScope[]) =>
      apiFetch<InformationReviewState[]>(`${path}/prepare`, { method: "POST", body: {
        documentId, expectedRawSha256: rawSha256,
        applicabilityStartDate: start, applicabilityEndDate: end,
        temporalPolicy, temporalVerifiedOn, temporalValidUntil,
        claimScopes,
      } }),
    decide: (reviewId: string, rawSha256: string, decision: "APPROVE" | "REJECT",
      conditionsReviewed: boolean, exceptionsReviewed: boolean,
      correctionCode?: ReviewCorrectionCode | null, evidenceLocator?: string | null) =>
      apiFetch<void>(`${path}/${encodeURIComponent(reviewId)}/decision`, { method: "POST", body: {
        expectedRawSha256: rawSha256, conditionsReviewed, exceptionsReviewed, decision,
        correctionCode, evidenceLocator,
      } }),
    decideCandidate: (documentId: string, chunkId: string, rawSha256: string,
      decision: "APPROVE" | "REJECT", claimScopes: InformationClaimScope[] | null,
      correctionCode?: ReviewCorrectionCode | null, evidenceLocator?: string | null) =>
      apiFetch<void>(`${path}/candidate-decision`, { method: "POST", body: {
        documentId, chunkId, expectedRawSha256: rawSha256, decision,
        conditionsReviewed: decision === "APPROVE", exceptionsReviewed: decision === "APPROVE",
        claimScopes, correctionCode: correctionCode ?? null, evidenceLocator: evidenceLocator ?? null,
      } }),
    revoke: (reviewId: string) => apiFetch<void>(`${path}/${encodeURIComponent(reviewId)}/revoke`, { method: "POST" }),
    ready: (documentId: string) => apiFetch<string>(
      `${path}/ready?documentId=${encodeURIComponent(documentId)}`, { method: "POST" }),
  };
}
