export function hasUnsavedIntake(draft, saved) {
  return draft !== null && draft !== (saved ?? "");
}

export function canConfirmIntake(state, draft) {
  return !!state && state.status === "SCENARIO_CONFIRMATION_REQUIRED" &&
    Array.isArray(state.scenarioCandidates) && state.scenarioCandidates.length === 1 &&
    !hasUnsavedIntake(draft, state.situationText);
}

export function hasUnsavedTopicSelection(selected, saved) {
  return selected !== undefined && selected !== (saved ?? null);
}

export function canConfirmTopic(state, draft, selected) {
  return !!state &&
    (state.status === "TOPIC_CONFIRMATION_REQUIRED" || state.status === "TOPIC_MISMATCH_CONFIRMATION_REQUIRED") &&
    Array.isArray(state.topicCandidates) && state.topicCandidates.length === 1 &&
    !hasUnsavedIntake(draft, state.situationText) &&
    !hasUnsavedTopicSelection(selected, state.selectedTopic);
}
