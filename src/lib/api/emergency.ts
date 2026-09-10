import { apiFetch } from "./client";

import type {
  EmergencyScenarioStateResponse,
  EmergencySelectionResponse,
  EmergencyType,
  EmergencyTypeOptionResponse,
} from "./types";

export function getEmergencyTypes() {
  return apiFetch<EmergencyTypeOptionResponse[]>(
    "/emergency/types",
  );
}

export function selectEmergencyType(
  type: EmergencyType,
) {
  return apiFetch<EmergencySelectionResponse>(
    "/emergency/selection",
    {
      method: "PUT",
      body: {
        type,
      },
    },
  );
}

export function getEmergencyScenario() {
  return apiFetch<EmergencyScenarioStateResponse>(
    "/emergency/scenario",
  );
}