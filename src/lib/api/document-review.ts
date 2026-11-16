import { apiFetch } from "./client";

export type DocumentSummary = { documentId: string; organization: string; platformDomain: string; title: string; officialUrl: string; publishedAt: string | null; documentVersion: number; rawSha256: string; hashMatches: boolean; usageDecision: string | null; approvedCount: number; pendingCount: number; activeGenerationMembership: boolean; textOnly: boolean };
export type UsageReview = { id: string; basisUrl: string; allowedScope: string; privacyReviewed: boolean; thirdPartyReviewed: boolean; decision: string; reviewerId: string; decidedAt: string; reason: string; previousReviewId: string | null };
export type Claim = { candidateId: string; body: string; start: number; end: number; context: string; publishedAt: string | null; currentApplicability: string; relations: { role: string; text: string; start: number; end: number; ambiguous: boolean }[]; hold: boolean; holdReason: string; status: string };
export type ClaimAudit = { candidateId: string; reviewerId: string; decision: string; reason: string; decidedAt: string };
export type Generation = { generationId: string; status: string; active: boolean; buildStatus: string | null };
export type UsageDecision = { expectedRawSha256: string; documentVersion: number; basisUrl: string; scopes: string[]; privacyReviewed: boolean; thirdPartyReviewed: boolean; decision: string; reason: string; expectedPreviousReviewId: string | null };

const root = "/source-review/document-claims";
const item = (id: string) => `${root}/${encodeURIComponent(id)}`;
const hash = (value: string) => `?expectedRawSha256=${encodeURIComponent(value)}`;
export const documentReviewApi = {
  registerText: (body: { registryId: string; html: string; title: string; publishedAt: string | null; basisUrl: string; reason: string; privacyReviewed: boolean; thirdPartyReviewed: boolean; storageApproved: boolean }) =>
    apiFetch<{ documentId: string; sourceVerification: string; contentReview: string }>(`${root}/text-registration`, { method: "POST", body }),
  documents: () => apiFetch<DocumentSummary[]>(root, { cache: "no-store" }),
  usage: (id: string, raw: string) => apiFetch<UsageReview[]>(`${item(id)}/usage-review${hash(raw)}`, { cache: "no-store" }),
  decideUsage: (id: string, body: UsageDecision) => apiFetch<UsageReview>(`${item(id)}/usage-review`, { method: "POST", body }),
  claims: (id: string, raw: string) => apiFetch<Claim[]>(`${item(id)}${hash(raw)}`, { cache: "no-store" }),
  prepare: (id: string, raw: string) => apiFetch<Claim[]>(`${item(id)}/prepare`, { method: "POST", body: { expectedRawSha256: raw } }),
  decide: (id: string, candidate: string, raw: string, decision: "APPROVE" | "REJECT") => apiFetch<void>(`${item(id)}/${encodeURIComponent(candidate)}/decision`, { method: "POST", body: { expectedRawSha256: raw, decision } }),
  audit: (id: string, raw: string) => apiFetch<ClaimAudit[]>(`${item(id)}/audit${hash(raw)}`, { cache: "no-store" }),
  generations: (id: string, raw: string) => apiFetch<Generation[]>(`${item(id)}/generations${hash(raw)}`, { cache: "no-store" }),
  candidate: (sourceKey: string, documentId: string, genericDocumentId: string) => apiFetch<string>(`/source-review/information/${encodeURIComponent(sourceKey)}/ready-candidate`, { method: "POST", body: { documentId, genericDocumentIds: [genericDocumentId] } }),
  generationAction: (sourceKey: string, generationId: string, action: "build" | "activate") => apiFetch<void>(`/source-review/information/${encodeURIComponent(sourceKey)}/ready-candidate/${encodeURIComponent(generationId)}/${action}`, { method: "POST" }),
};
