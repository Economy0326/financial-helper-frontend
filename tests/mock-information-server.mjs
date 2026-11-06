// Local UI fixture only. No real financial data or external services.
import { createServer } from "node:http";

const id = "00000000-0000-4000-8000-000000000001";
const source = {
  sourceDocumentId: "synthetic-document", documentVersion: 1, rawSha256: "a".repeat(64),
  supportChunkId: "synthetic-support", applicabilityReviewId: "synthetic-review", scopeKind: "COMMON",
  organizationName: "시연용 합성 기관", title: "시연용 합성 문서", canonicalUrl: "https://synthetic.invalid/source",
  articleReference: "제1항", pageReference: null, supportLocator: "문단 1", supportText: "합성 안내 문장입니다.",
  applicableInstitution: null, applicableProduct: "개인 신용카드", applicabilityStartDate: "2026-01-01",
  applicabilityEndDate: "2026-12-31", conditions: [{ chunkId: "c", locator: "문단 2", text: "합성 조건" }],
  exceptions: [{ chunkId: "e", locator: "문단 3", text: "합성 예외" }],
};
const snapshot = { caseInputRevision: 2, followUpAnswerRevision: 0, scenario: "CARD_LOSS_UNAUTHORIZED_USE",
  confirmedFacts: [{ key: "productType", value: "개인 신용카드" }], missingFacts: ["INSTITUTION"],
  coverageGaps: ["INSTITUTION_UNCONFIRMED"], sourceIntegrityStatus: "CURRENT_READY_SOURCE_AND_HASH",
  humanScopeReviewStatus: "V38_SCOPE_REVIEWED", caseApplicabilityStatus: "NOT_DETERMINED" };
let state = "NOT_FOUND";
createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3101");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-XSRF-TOKEN");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "X-XSRF-TOKEN");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  const url = new URL(req.url ?? "/", "http://localhost:3199");
  if (url.pathname === "/__mock") { state = url.searchParams.get("state") ?? "NOT_FOUND"; res.end(JSON.stringify({ state })); return; }
  if (url.pathname === "/api/v1/session") {
    res.setHeader("Set-Cookie", "XSRF-TOKEN=synthetic; Path=/; SameSite=Lax");
    res.setHeader("X-XSRF-TOKEN", "synthetic");
    res.end(JSON.stringify({ guest: true, authenticated: true, hasActiveConsultation: true })); return;
  }
  if (url.pathname === "/api/v1/consultations/active") {
    res.end(JSON.stringify({ active: true, consultation: { consultationId: id, category: "CARD", scenario: "CARD_LOSS_UNAUTHORIZED_USE", status: "IN_PROGRESS", currentStep: "FOLLOW_UP", updatedAt: "2026-01-01T00:00:00Z" } })); return;
  }
  if (url.pathname.endsWith("/procedure-follow-up")) { res.end(JSON.stringify({ kind: "complete", caseInputRevision: 2 })); return; }
  if (url.pathname.endsWith("/information-report/prepare") && req.method === "POST") state = "READY_CANDIDATES";
  if (url.pathname.includes("/information-report")) {
    if (state === "AUTH_ERROR") { res.writeHead(401).end(JSON.stringify({ error: { message: "synthetic authentication failure" } })); return; }
    const ready = state === "READY_CANDIDATES";
    res.end(JSON.stringify({ consultationId: id, status: state, reason: null, generatedAt: null,
      snapshot: ready || state === "INSUFFICIENT_EVIDENCE" ? snapshot : null,
      selectedEvidence: ready ? [source] : [], explanations: ready ? [{ supportChunkId: source.supportChunkId,
        mode: "AI_SELECTED_TEMPLATE", easyText: "합성 안내 문장입니다. 내 상황에 적용되는지는 확인되지 않았습니다.",
        conditions: source.conditions, exceptions: source.exceptions }] : [] })); return;
  }
  res.writeHead(404).end(JSON.stringify({ error: { message: "synthetic route not found" } }));
}).listen(3199, "127.0.0.1", () => process.stdout.write("Synthetic UI fixture listening on 127.0.0.1:3199\n"));
