import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { visibleSnapshot, visibleReport, officialHttpsUrl } from "../src/lib/consultation/document-evidence-state.mjs";

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
