import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { clarificationCondition, visibleSnapshot, visibleReport, officialHttpsUrl, groupEvidence, relationIsInExcerpt } from "../src/lib/consultation/document-evidence-state.mjs";

test("groups by source and preserves distinct conditions and exceptions", () => {
  const base = { documentId: "doc", documentVersion: 1, officialUrl: "https://example.org/a", excerpt: "원문", related: [{ role: "CONDITION", text: "조건" }] };
  const duplicate = { ...base, claimId: "b" };
  const different = { ...base, claimId: "c", related: [{ role: "EXCEPTION", text: "예외" }] };
  const other = { ...base, documentId: "other", claimId: "d" };
  const groups = groupEvidence([{ ...base, claimId: "a" }, duplicate, different, other]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[0].items[0].related[0].text, "조건");
  assert.equal(groups[0].items[1].related[0].text, "예외");
  assert.equal(relationIsInExcerpt("조건과 예외 원문", "예외"), true);
  assert.equal(relationIsInExcerpt("조건 원문", "별도 예외"), false);
});

test("clarification uses a real condition only for a personal applicability question", () => {
  const evidence = [{ related: [{ role: "CONDITION", text: "신규 계약에 한함" }] }];
  assert.equal(clarificationCondition("대출이 무엇인가요?", evidence), null);
  assert.equal(clarificationCondition("제가 대상인가요?", []), null);
  assert.equal(clarificationCondition("제가 대상인가요?", evidence), "신규 계약에 한함");
  assert.equal(clarificationCondition("신규 계약에 한함, 제가 대상인가요?", evidence), null);
});

test("STALE and unknown responses cannot expose previous content", () => {
  const evidence = [{ excerpt: "old sensitive content" }];
  assert.deepEqual(visibleSnapshot({ status: "STALE", evidence }), []);
  assert.deepEqual(visibleSnapshot({ status: "UNKNOWN", evidence }), []);
  assert.equal(visibleReport({ status: "STALE", explanation: "old", evidence }), null);
  assert.equal(visibleReport({ status: "UNKNOWN", explanation: "old", evidence }), null);
  assert.equal(visibleSnapshot({ status: "READY_CANDIDATES", evidence }), evidence);
  assert.equal(visibleReport({ status: "READY", evidence }).evidence, evidence);
});

test("source link uses only a valid HTTPS URL without user information", () => {
  assert.equal(officialHttpsUrl("javascript:alert(1)"), null);
  assert.equal(officialHttpsUrl("https://user:password@example.invalid/"), null);
  assert.equal(officialHttpsUrl("https://example.invalid/a"), null);
  assert.equal(officialHttpsUrl("https://example.org/a"), "https://example.org/a");
});

test("frontend API functions follow the backend paths and bodies", async () => {
  const calls = [];
  globalThis.__documentEvidenceFetch = async (...args) => { calls.push(args); return {}; };
  try {
    const source = (await readFile(new URL("../src/lib/api/document-evidence.ts", import.meta.url), "utf8"))
      .replace('import { apiFetch } from "./client";', "const apiFetch = globalThis.__documentEvidenceFetch;");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
    const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
    await api.searchDocumentEvidence("금융 질문");
    await api.getEvidenceSnapshot("snapshot-id");
    await api.createEvidenceReport("snapshot-id", "금융 질문");
    await api.getEvidenceReport("report-id");
    await api.explainDocumentEvidence("snapshot-id", "request-id");
    await api.getExplanationQuota();
    await api.getInformationTopics();
    await api.searchDocumentEvidence("금융 질문", { title: "제목", excerpt: "원문" });
    await api.getExplanationQuota("snapshot-id");
    assert.deepEqual(calls.map(([path]) => path), [
      "/information-evidence-snapshots", "/information-evidence-snapshots/snapshot-id",
      "/information-evidence-snapshots/snapshot-id/report", "/information-evidence-snapshots/reports/report-id",
      "/information-evidence-snapshots/snapshot-id/explanation", "/information-evidence-snapshots/explanation-quota",
      "/information-evidence-snapshots/topics", "/information-evidence-snapshots",
      "/information-evidence-snapshots/explanation-quota?snapshotId=snapshot-id",
    ]);
    assert.deepEqual(calls[0][1].body, { question: "금융 질문" });
    assert.deepEqual(calls[2][1].body, { question: "금융 질문" });
    assert.equal(calls[4][1].method, "POST");
    assert.deepEqual(calls[4][1].body, { requestId: "request-id" });
    assert.deepEqual(calls[7][1].body, { question: "금융 질문", selection: { title: "제목", excerpt: "원문" } });
    assert.ok(calls.every(([, options]) => options.cache === "no-store"));
  } finally { delete globalThis.__documentEvidenceFetch; }
});
