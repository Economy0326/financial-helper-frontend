import { test } from "node:test";
import assert from "node:assert/strict";
import { canConfirmIntake, hasUnsavedIntake } from "../src/lib/consultation/intake-state.mjs";

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
