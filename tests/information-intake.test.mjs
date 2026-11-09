import { test } from "node:test";
import assert from "node:assert/strict";
import { canConfirmIntake, canConfirmTopic, hasUnsavedIntake, hasUnsavedTopicSelection } from "../src/lib/consultation/intake-state.mjs";

test("only an unchanged single candidate may be confirmed", () => {
  const state = { status: "SCENARIO_CONFIRMATION_REQUIRED", situationText: "입력", scenarioCandidates: ["CARD_LOSS_UNAUTHORIZED_USE"] };
  assert.equal(canConfirmIntake(state, null), true);
  assert.equal(canConfirmIntake(state, "변경"), false);
  assert.equal(canConfirmIntake({ ...state, scenarioCandidates: [] }, null), false);
  assert.equal(canConfirmIntake({ ...state, scenarioCandidates: ["A", "B"] }, null), false);
  assert.equal(canConfirmIntake({ ...state, status: "UNSUPPORTED_SCOPE" }, null), false);
  assert.equal(canConfirmIntake({ ...state, status: "NEEDS_CLARIFICATION" }, null), false);
  assert.equal(canConfirmIntake(undefined, null), false);
  assert.equal(hasUnsavedIntake("", null), false);
});

test("topic confirmation waits for saved input and a single Backend candidate", () => {
  const state = { status: "TOPIC_MISMATCH_CONFIRMATION_REQUIRED", situationText: "예금자보호 제도가 궁금해요", selectedTopic: "INSURANCE", topicCandidates: ["DEPOSITS_ACCOUNTS"] };
  assert.equal(canConfirmTopic(state, null, undefined), true);
  assert.equal(canConfirmTopic({ ...state, status: "TOPIC_CONFIRMATION_REQUIRED" }, null, undefined), true);
  assert.equal(canConfirmTopic(state, "수정 중", undefined), false);
  assert.equal(canConfirmTopic(state, null, "CARD_PAYMENTS"), false);
  assert.equal(canConfirmTopic({ ...state, topicCandidates: ["DEPOSITS_ACCOUNTS", "INSURANCE"] }, null, undefined), false);
  assert.equal(canConfirmTopic({ ...state, status: "TOPIC_CONFIRMED_NO_SEARCH" }, null, undefined), false);
  assert.equal(hasUnsavedTopicSelection(undefined, "INSURANCE"), false);
  assert.equal(hasUnsavedTopicSelection(null, "INSURANCE"), true);
});
