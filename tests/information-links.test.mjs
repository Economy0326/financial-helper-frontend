import test from "node:test";
import assert from "node:assert/strict";
import { safeOfficialLink, isSyntheticTestDomain } from "../src/lib/consultation/information-links.mjs";

test("renders only safe HTTPS source links without credentials", () => {
  assert.equal(safeOfficialLink("https://www.example.org/article#section"), "https://www.example.org/article#section");
  for (const input of ["javascript:alert(1)", "http://example.org/", "https://user:secret@example.org/", "not a URL"]) {
    assert.equal(safeOfficialLink(input), null);
  }
});

test("reserved synthetic domains are labelled and never linked", () => {
  assert.equal(isSyntheticTestDomain("https://synthetic.invalid/source"), true);
  assert.equal(safeOfficialLink("https://synthetic.invalid/source"), null);
  assert.equal(isSyntheticTestDomain("https://invalid.example.org/"), false);
  assert.equal(isSyntheticTestDomain("not a URL"), false);
});
