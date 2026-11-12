import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/components/source-review/SourceReviewComponents.tsx");
const source = readFileSync(file, "utf8");
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const Module = require("node:module");
const loaded = new Module(file);
loaded.filename = file;
loaded.paths = Module._nodeModulePaths(path.dirname(file));
loaded._compile(output, file);
const { SourceText, SourceLocation, ReviewProgress, ReviewWorkQueue, auditsForQuestion, ReviewAuditList } = loaded.exports;

test("work queue links only persisted unresolved review items", () => {
  const items = [
    { id: "review-item-1", title: "Q1", status: "APPROVED" },
    { id: "review-item-2", title: "Q2", status: "PENDING" },
    { id: "review-item-3", title: "Q3", status: "REJECTED" },
  ];
  const html = renderToStaticMarkup(React.createElement(ReviewWorkQueue, { items }));
  assert.match(html, /href="#review-item-2"/);
  assert.match(html, /href="#review-item-3"/);
  assert.doesNotMatch(html, /href="#review-item-1"/);
  assert.match(html, /공식 원문 변경 감지는 아직 제공하지 않습니다/);
  const complete = renderToStaticMarkup(React.createElement(ReviewWorkQueue, { items: items.slice(0, 1) }));
  assert.match(complete, /검토 대기 또는 거절·철회된 항목이 없습니다/);
});

test("PDF display separates page markers and paragraph glyphs while preserving conditions and notes", () => {
  const body = "□ 보호상품으로 운용되는 경우\nㅇ 원금과 소정의 이자\n[PAGE 3]\n① 사고보험금\n※ (예) 별도 한도";
  const html = renderToStaticMarkup(React.createElement(SourceText, { body, squareParagraphGlyph: true }));
  assert.match(html, /• 보호상품으로 운용되는 경우/);
  assert.match(html, /ㅇ 원금과 소정의 이자/);
  assert.match(html, /PDF 3페이지 시작/);
  assert.match(html, /① 사고보험금/);
  assert.match(html, /※ \(예\) 별도 한도/);
  assert.doesNotMatch(html, /\[PAGE 3\]/);
  assert.equal(body.includes("□"), true); // formatting does not mutate source data
  const unclassified = renderToStaticMarkup(React.createElement(SourceText, { body: "□ 동의" }));
  assert.match(unclassified, /□ 동의/);
});

test("human page range is visible and raw UTF-16 locator stays in technical details", () => {
  const html = renderToStaticMarkup(React.createElement(SourceLocation, {
    pageReference: "p.1-2", locator: "normalized-content:utf16:302-899",
  }));
  assert.match(html, /공식 PDF 1~2페이지/);
  assert.match(html, /<details/);
  assert.match(html, /normalized-content:utf16:302-899/);
});

test("review progress distinguishes recorded, current, and waiting states", () => {
  const html = renderToStaticMarkup(React.createElement(ReviewProgress, { stages: [
    { label: "원문 확인", state: "done", detail: "검토표 기록" },
    { label: "항목별 승인·거절", state: "current", detail: "1건" },
    { label: "후속", state: "waiting", detail: "대기" },
  ] }));
  assert.match(html, /aria-current="step"/);
  assert.match(html, /완료/);
  assert.match(html, /진행 중/);
  assert.match(html, /대기/);
  assert.match(html, /READY 검증 전/);
});

test("each approved item gets its own audit entry and both views use Korean Seoul time", () => {
  const rows = [1, 2, 3, 5, 6, 7, 8, 9, 10].map((question) => ({
    question, reviewId: `review-${question}`, decision: "APPROVED",
    decidedAt: "2026-11-12T00:00:00Z", reviewerAccountId: "synthetic-reviewer",
    rawSha256: "synthetic-hash",
  }));
  for (const question of [1, 2, 3, 5, 6, 7, 8, 9, 10]) {
    const item = auditsForQuestion(rows, question);
    assert.equal(item.length, 1);
    const html = renderToStaticMarkup(React.createElement(ReviewAuditList, { rows: item }));
    assert.match(html, new RegExp(`Q${question} · 승인 완료`));
    assert.match(html, /한국 시간/);
    assert.match(html, /<details/);
  }
  assert.equal(auditsForQuestion(rows, 4).length, 0);
});
