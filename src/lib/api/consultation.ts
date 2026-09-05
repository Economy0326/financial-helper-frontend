import { apiFetch } from "./client";

import type {
  ActiveConsultationResponse,
  ConfirmConsultationSummaryResponse,
  ConsultationCategory,
  ConsultationCreateResponse,
  ConsultationDetailResponse,
  ConsultationSummaryStateResponse,
  FollowUpStateResponse,
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

export function getConsultation(
  consultationId: string,
) {
  return apiFetch<ConsultationDetailResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}`,
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

export function prepareFollowUp(
  consultationId: string,
) {
  return apiFetch<FollowUpStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/follow-up/prepare`,
    {
      method: "POST",
    },
  );
}

export function getFollowUpState(
  consultationId: string,
  questionNumber?: number | null,
) {
  const query =
    questionNumber == null
      ? ""
      : `?questionNumber=${encodeURIComponent(
          String(questionNumber),
        )}`;

  return apiFetch<FollowUpStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/follow-up${query}`,
  );
}

export function updateFollowUpAnswer(
  consultationId: string,
  questionId: string,
  answer: string,
) {
  return apiFetch<FollowUpStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/follow-up/questions/${encodeURIComponent(
      questionId,
    )}/answer`,
    {
      method: "PUT",
      body: {
        answer,
      },
    },
  );
}

export function getConsultationSummary(
  consultationId: string,
) {
  return apiFetch<ConsultationSummaryStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/summary`,
  );
}

export function prepareConsultationSummary(
  consultationId: string,
) {
  return apiFetch<ConsultationSummaryStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/summary/prepare`,
    {
      method: "POST",
    },
  );
}

export function confirmConsultationSummary(
  consultationId: string,
) {
  return apiFetch<ConfirmConsultationSummaryResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/summary/confirm`,
    {
      method: "POST",
    },
  );
}