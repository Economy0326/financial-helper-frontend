import test from "node:test";
import assert from "node:assert/strict";
import { safeOfficialLink } from "../src/lib/financial-information/information-links.mjs";

test("renders only safe HTTPS source links without credentials", () => {
  assert.equal(safeOfficialLink("https://www.example.org/article#section"), "https://www.example.org/article#section");
  for (const input of ["javascript:alert(1)", "http://example.org/", "https://user:secret@example.org/", "not a URL"]) {
    assert.equal(safeOfficialLink(input), null);
  }
});

test("reserved synthetic domains are never linked", () => {
  assert.equal(safeOfficialLink("https://synthetic.invalid/source"), null);
  assert.equal(safeOfficialLink("https://invalid.example.org/"), "https://invalid.example.org/");
});
