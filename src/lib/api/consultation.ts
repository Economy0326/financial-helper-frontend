import { apiFetch } from "./client";

import type {
  ActiveConsultationResponse,
  ConsultationCategory,
  ConsultationCreateResponse,
  UpdateCategoryResponse,
  UpdateSituationResponse,
} from "./types";

export function startConsultation() {
  return apiFetch<ConsultationCreateResponse>(
    "/consultations",
    {
      method: "POST",
    },
  );
}

export function getActiveConsultation() {
  return apiFetch<ActiveConsultationResponse>(
    "/consultations/active",
  );
}

export function updateConsultationCategory(
  consultationId: string,
  category: ConsultationCategory,
) {
  return apiFetch<UpdateCategoryResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/category`,
    {
      method: "PUT",
      body: {
        category,
      },
    },
  );
}

export function updateConsultationSituation(
  consultationId: string,
  situationText: string,
) {
  return apiFetch<UpdateSituationResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/situation`,
    {
      method: "PUT",
      body: {
        situationText,
      },
    },
  );
}