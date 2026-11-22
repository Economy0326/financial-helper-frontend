import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

test("common reviewer uses existing backend routes and explicit decision bodies", async () => {
  const calls = [];
  globalThis.__reviewFetch = async (...args) => { calls.push(args); return []; };
  try {
    const source = (await readFile(new URL("../src/lib/api/document-review.ts", import.meta.url), "utf8"))
      .replace('import { apiFetch } from "./client";', "const apiFetch = globalThis.__reviewFetch;");
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
    const { documentReviewApi: api } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
    await api.documents(); await api.usage("doc", "hash"); await api.prepare("doc", "hash");
    await api.decide("doc", "claim", "hash", "APPROVE"); await api.audit("doc", "hash");
    await api.generations("doc", "hash");
    await api.registerText({ registryId: "registry", html: "<p>합성</p>", title: "합성", publishedAt: null, basisUrl: "https://synthetic.invalid", reason: "합성 검토", privacyReviewed: true, thirdPartyReviewed: true, storageApproved: true });
    await api.registerSource({ registryId: "registry", basisUrl: "https://synthetic.invalid", reason: "합성 검토", privacyReviewed: true, thirdPartyReviewed: true, storageApproved: true });
    await api.addCandidate("https://www.fsc.go.kr/no010101/example");
    await api.previewCandidate("registry");
    assert.deepEqual(calls.map(([path]) => path), ["/source-review/document-claims", "/source-review/document-claims/doc/usage-review?expectedRawSha256=hash",
      "/source-review/document-claims/doc/prepare", "/source-review/document-claims/doc/claim/decision",
      "/source-review/document-claims/doc/audit?expectedRawSha256=hash", "/source-review/document-claims/doc/generations?expectedRawSha256=hash",
      "/source-review/document-claims/text-registration", "/source-review/document-claims/registered-source",
      "/source-review/document-claims/registry-candidates", "/source-review/document-claims/registry-candidates/registry/preview"]);
    assert.deepEqual(calls[3][1].body, { expectedRawSha256: "hash", decision: "APPROVE" });
    assert.equal(calls[7][1].body.registryId, "registry");
    assert.equal("html" in calls[7][1].body, false);
    assert.deepEqual(calls[8][1].body, { domain: "fsc.go.kr", url: "https://www.fsc.go.kr/no010101/example" });
    await api.addCandidate("https://www.korea.kr/news/policyNewsView.do?newsId=148960978");
    assert.deepEqual(calls.at(-1)[1].body, { domain: "korea.kr", url: "https://www.korea.kr/news/policyNewsView.do?newsId=148960978" });
    await api.decide("doc", "claim", "hash", "REJECT", "이유");
    assert.equal(calls.at(-1)[1].body.reason, "이유");
    await api.prepareBatch(["doc-a", "doc-b"]);
    await api.buildBatch("generation");
    await api.activateBatch("generation");
    assert.deepEqual(calls.slice(-3).map(([path]) => path), ["/source-review/document-claims/batch-ready", "/source-review/document-claims/batch-ready/generation/build", "/source-review/document-claims/batch-ready/generation/activate"]);
    assert.deepEqual(calls.at(-3)[1].body, { documentIds: ["doc-a", "doc-b"] });
    await api.prepareLatest("doc", "hash");
    assert.equal(calls.at(-1)[0], "/source-review/document-claims/doc/prepare-latest");
    await api.prepareBatch(["doc-a"], { "doc-a": "LATEST" });
    assert.deepEqual(calls.at(-1)[1].body, { documentIds: ["doc-a"], versions: { "doc-a": "LATEST" } });
    await api.unchangedBatch(["doc-a"], { "doc-a": "LATEST" });
    assert.equal(calls.at(-1)[0], "/source-review/document-claims/batch-ready/unchanged");
    assert.deepEqual(calls.at(-1)[1].body, { documentIds: ["doc-a"], versions: { "doc-a": "LATEST" } });
  } finally { delete globalThis.__reviewFetch; }
});
