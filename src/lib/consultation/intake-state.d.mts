import type { InformationIntakeState } from "../api/types";
export function hasUnsavedIntake(draft: string | null, saved: string | null): boolean;
export function canConfirmIntake(state: InformationIntakeState | undefined, draft: string | null): boolean;
