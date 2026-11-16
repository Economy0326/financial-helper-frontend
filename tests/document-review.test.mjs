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
    await api.generations("doc", "hash"); await api.candidate("base", "base-doc", "doc");
    assert.deepEqual(calls.map(([path]) => path), ["/source-review/document-claims", "/source-review/document-claims/doc/usage-review?expectedRawSha256=hash",
      "/source-review/document-claims/doc/prepare", "/source-review/document-claims/doc/claim/decision",
      "/source-review/document-claims/doc/audit?expectedRawSha256=hash", "/source-review/document-claims/doc/generations?expectedRawSha256=hash",
      "/source-review/information/base/ready-candidate"]);
    assert.deepEqual(calls[3][1].body, { expectedRawSha256: "hash", decision: "APPROVE" });
    assert.deepEqual(calls[6][1].body, { documentId: "base-doc", genericDocumentIds: ["doc"] });
  } finally { delete globalThis.__reviewFetch; }
});
