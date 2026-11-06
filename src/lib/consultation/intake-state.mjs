export function hasUnsavedIntake(draft, saved) {
  return draft !== null && draft !== (saved ?? "");
}

export function canConfirmIntake(state, draft) {
  return !!state && state.status === "SCENARIO_CONFIRMATION_REQUIRED" &&
    Array.isArray(state.scenarioCandidates) && state.scenarioCandidates.length === 1 &&
    !hasUnsavedIntake(draft, state.situationText);
}
