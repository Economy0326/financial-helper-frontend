import { test } from "node:test";
import assert from "node:assert/strict";
import { nearbyReviewContext } from "../src/lib/source-review/reviewer-context.mjs";

test("review context uses adjacent sentences and verifies UTF-16 offsets", () => {
  const context = "먼 앞 문장. 바로 앞 😀 문장. 금융 근거입니다. 바로 뒤 문장. 먼 뒤 문장.";
  const body = "금융 근거입니다.";
  const local = context.indexOf(body);
  assert.deepEqual(nearbyReviewContext({ context, body, contextStart: 100, start: 100 + local, end: 100 + local + body.length }),
    { before: "바로 앞 😀 문장.", after: "바로 뒤 문장.", paragraph: context });
  assert.equal(nearbyReviewContext({ context, body, contextStart: 100, start: 100 + local + 1, end: 100 + local + body.length }), null);
});
