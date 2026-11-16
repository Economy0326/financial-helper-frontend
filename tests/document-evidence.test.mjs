import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { clarificationCondition, followUpQuery, visibleSnapshot, visibleReport, officialHttpsUrl } from "../src/lib/consultation/document-evidence-state.mjs";

test("clarification uses a real condition only for a personal applicability question", () => {
  const evidence = [{ related: [{ role: "CONDITION", text: "신규 계약에 한함" }] }];
  assert.equal(clarificationCondition("대출이 무엇인가요?", evidence), null);
  assert.equal(clarificationCondition("제가 대상인가요?", []), null);
  assert.equal(clarificationCondition("제가 대상인가요?", evidence), "신규 계약에 한함");
  assert.equal(clarificationCondition("신규 계약에 한함, 제가 대상인가요?", evidence), null);
});

test("follow-up keeps context only for explicit referential openings", () => {
  const evidence = [{ excerpt: "예금의 연체 중이면 조건", related: [] }];
  assert.equal(followUpQuery("예금 질문", "그러면 연체 중이면?", evidence), "예금 질문 연체 중이면?");
  assert.equal(followUpQuery("예금 질문", "그러면 보험은?", evidence), "보험은?");
  assert.equal(followUpQuery("예금 질문", "보험 조건은?"), "보험 조건은?");
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

test("frontend API functions follow the four backend paths and bodies", async () => {
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
    assert.deepEqual(calls.map(([path]) => path), [
      "/information-evidence-snapshots", "/information-evidence-snapshots/snapshot-id",
      "/information-evidence-snapshots/snapshot-id/report", "/information-evidence-snapshots/reports/report-id",
    ]);
    assert.deepEqual(calls[0][1].body, { question: "금융 질문" });
    assert.deepEqual(calls[2][1].body, { question: "금융 질문" });
    assert.ok(calls.every(([, options]) => options.cache === "no-store"));
  } finally { delete globalThis.__documentEvidenceFetch; }
});
