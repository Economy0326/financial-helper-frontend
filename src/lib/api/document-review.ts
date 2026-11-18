import { apiFetch } from "./client";

export type DocumentSummary = { documentId: string; organization: string; platformDomain: string; title: string; officialUrl: string; publishedAt: string | null; documentVersion: number; rawSha256: string; hashMatches: boolean; usageDecision: string | null; approvedCount: number; pendingCount: number; activeGenerationMembership: boolean; textOnly: boolean };
export type UsageReview = { id: string; basisUrl: string; allowedScope: string; privacyReviewed: boolean; thirdPartyReviewed: boolean; decision: string; reviewerId: string; decidedAt: string; reason: string; previousReviewId: string | null };
export type Claim = { candidateId: string; body: string; start: number; end: number; context: string; contextStart: number; publishedAt: string | null; currentApplicability: string; relations: { role: string; text: string; start: number; end: number; ambiguous: boolean }[]; hold: boolean; holdReason: string; status: string };
export type ClaimAudit = { candidateId: string; reviewerId: string; decision: string; reason: string; decidedAt: string };
export type ClaimScope = { id: string; claimId: string; scopeText: string; evidenceText: string; reviewStatus: string };
export type Generation = { generationId: string; status: string; active: boolean; buildStatus: string | null };
export type UsageDecision = { expectedRawSha256: string; documentVersion: number; basisUrl: string; scopes: string[]; privacyReviewed: boolean; thirdPartyReviewed: boolean; decision: string; reason: string; expectedPreviousReviewId: string | null };

const root = "/source-review/document-claims";
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
const hash = (value: string) => `?expectedRawSha256=${encodeURIComponent(value)}`;
export const documentReviewApi = {
  prepareBatch: (documentIds: string[]) => apiFetch<string>(`${root}/batch-ready`, { method: "POST", body: { documentIds } }),
  buildBatch: (id: string) => apiFetch<void>(`${root}/batch-ready/${encodeURIComponent(id)}/build`, { method: "POST" }),
  activateBatch: (id: string) => apiFetch<void>(`${root}/batch-ready/${encodeURIComponent(id)}/activate`, { method: "POST" }),
  addCandidate: (url: string) => apiFetch<{ registryId: string; officialUrl: string; organization: string; documentId: string | null }>(`${root}/registry-candidates`, { method: "POST", body: { domain: new URL(url).hostname.toLowerCase() === "www.korea.kr" ? "korea.kr" : "fsc.go.kr", url } }),
  previewCandidate: (id: string) => apiFetch<{ title: string; publishedAt: string | null; officialUrl: string; usageStatus: string; licenseType: string; previewSha256: string | null }>(`${root}/registry-candidates/${encodeURIComponent(id)}/preview`, { method: "POST", cache: "no-store" }),
  registerSource: (body: { registryId: string; basisUrl: string; reason: string; privacyReviewed: boolean; thirdPartyReviewed: boolean; storageApproved: boolean; requireTypeOne?: boolean; expectedPreviewSha256?: string }) =>
    apiFetch<{ documentId: string; sourceVerification: string; contentReview: string }>(`${root}/registered-source`, { method: "POST", body }),
  registerText: (body: { registryId: string; html: string; title: string; publishedAt: string | null; basisUrl: string; reason: string; privacyReviewed: boolean; thirdPartyReviewed: boolean; storageApproved: boolean }) =>
    apiFetch<{ documentId: string; sourceVerification: string; contentReview: string }>(`${root}/text-registration`, { method: "POST", body }),
  documents: () => apiFetch<DocumentSummary[]>(root, { cache: "no-store" }),
  usage: (id: string, raw: string) => apiFetch<UsageReview[]>(`${item(id)}/usage-review${hash(raw)}`, { cache: "no-store" }),
  decideUsage: (id: string, body: UsageDecision) => apiFetch<UsageReview>(`${item(id)}/usage-review`, { method: "POST", body }),
  claims: (id: string, raw: string) => apiFetch<Claim[]>(`${item(id)}${hash(raw)}`, { cache: "no-store" }),
  prepare: (id: string, raw: string) => apiFetch<Claim[]>(`${item(id)}/prepare`, { method: "POST", body: { expectedRawSha256: raw } }),
  claimScopes: (id: string, raw: string) => apiFetch<ClaimScope[]>(`${item(id)}/scope-candidates${hash(raw)}`, { cache: "no-store" }),
  prepareClaimScopes: (id: string, raw: string) => apiFetch<ClaimScope[]>(`${item(id)}/scope-candidates/prepare`, { method: "POST", body: { expectedRawSha256: raw } }),
  decideScope: (id: string, raw: string, scopeId: string, decision: "REJECTED") => apiFetch<void>(`${item(id)}/scope-candidates/${encodeURIComponent(scopeId)}/decision`, { method: "POST", body: { expectedRawSha256: raw, decision } }),
  addScopeEvidence: (id: string, claimId: string, raw: string, evidenceText: string) => apiFetch<void>(`${item(id)}/${encodeURIComponent(claimId)}/scope-candidates`, { method: "POST", body: { expectedRawSha256: raw, evidenceText } }),
  reapproveScopes: (id: string, claimId: string, raw: string, scopeCandidateIds: string[]) => apiFetch<void>(`${item(id)}/${encodeURIComponent(claimId)}/reapprove-scopes`, { method: "POST", body: { expectedRawSha256: raw, scopeCandidateIds } }),
  approveWithScopes: (id: string, claimId: string, raw: string, scopeCandidateIds: string[]) => apiFetch<void>(`${item(id)}/${encodeURIComponent(claimId)}/decision`, { method: "POST", body: { expectedRawSha256: raw, decision: "APPROVE", scopeCandidateIds } }),
  decide: (id: string, candidate: string, raw: string, decision: "APPROVE" | "REJECT", reason?: string) => apiFetch<void>(`${item(id)}/${encodeURIComponent(candidate)}/decision`, { method: "POST", body: { expectedRawSha256: raw, decision, ...(reason === undefined ? {} : { reason }) } }),
  reconsider: (id: string, candidate: string, raw: string) => apiFetch<void>(`${item(id)}/${encodeURIComponent(candidate)}/reconsider`, { method: "POST", body: { expectedRawSha256: raw } }),
  withdraw: (id: string, candidate: string, raw: string, reason?: string) => apiFetch<void>(`${item(id)}/${encodeURIComponent(candidate)}/withdraw`, { method: "POST", body: { expectedRawSha256: raw, reason } }),
  audit: (id: string, raw: string) => apiFetch<ClaimAudit[]>(`${item(id)}/audit${hash(raw)}`, { cache: "no-store" }),
  generations: (id: string, raw: string) => apiFetch<Generation[]>(`${item(id)}/generations${hash(raw)}`, { cache: "no-store" }),
  candidate: (sourceKey: string, documentId: string, genericDocumentId: string) => apiFetch<string>(`/source-review/information/${encodeURIComponent(sourceKey)}/ready-candidate`, { method: "POST", body: { documentId, genericDocumentIds: [genericDocumentId] } }),
  generationAction: (sourceKey: string, generationId: string, action: "build" | "activate") => apiFetch<void>(`/source-review/information/${encodeURIComponent(sourceKey)}/ready-candidate/${encodeURIComponent(generationId)}/${action}`, { method: "POST" }),
};
