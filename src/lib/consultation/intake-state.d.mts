import type { InformationIntakeState } from "../api/types";
export function hasUnsavedIntake(draft: string | null, saved: string | null): boolean;
export function canConfirmIntake(state: InformationIntakeState | undefined, draft: string | null): boolean;
export function hasUnsavedTopicSelection(selected: string | null | undefined, saved: string | null): boolean;
export function canConfirmTopic(state: InformationIntakeState | undefined, draft: string | null, selected: string | null | undefined): boolean;
