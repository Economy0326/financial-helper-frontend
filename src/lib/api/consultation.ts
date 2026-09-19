import { apiFetch } from "./client";

import type {
  ActiveConsultationStateResponse,
  AnalysisStateResponse,
  ConfirmConsultationSummaryResponse,
  ConsultationCategory,
  ConsultationScenario,
  ConsultationCreateResponse,
  ConsultationDetailResponse,
  ConsultationSummaryStateResponse,
  ConsultationReportResponse,
  FollowUpStateResponse,
  InformationSupplementContextResponse,
  UpdateCategoryResponse,
  UpdateSituationResponse,
  ReopenAnalysisResponse,
} from "./types";

export function startConsultation(startNew = false) {
  return apiFetch<ConsultationCreateResponse>(
    `/consultations${startNew ? "?new=true" : ""}`,
    {
      method: "POST",
    },
  );
}

export function getActiveConsultation() {
  return apiFetch<ActiveConsultationStateResponse>(
    "/consultations/active",
  ).then((response) => response.active ? response.consultation : null);
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
  scenario?: ConsultationScenario,
) {
  return apiFetch<UpdateCategoryResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/category`,
    {
      method: "PUT",
      body: {
        category,
        ...(scenario ? { scenario } : {}),
      },
    },
  );
}

export function updateConsultationSituation(
  consultationId: string,
  situationText: string,
  editFromSummary = false,
) {
  return apiFetch<UpdateSituationResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/situation${editFromSummary ? "?edit=true" : ""}`,
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
  review = false,
) {
  const reviewQuery = review
    ? "?review=true"
    : "";

  return apiFetch<ConsultationSummaryStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/summary${reviewQuery}`,
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

export function startConsultationAnalysis(
  consultationId: string,
) {
  return apiFetch<AnalysisStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/analysis/start`,
    {
      method: "POST",
    },
  );
}

export function getConsultationAnalysis(
  consultationId: string,
) {
  return apiFetch<AnalysisStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/analysis`,
  );
}

export function retryConsultationAnalysis(
  consultationId: string,
) {
  return apiFetch<AnalysisStateResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/analysis/retry`,
    {
      method: "POST",
    },
  );
}

export function reopenConsultationAnalysis(
  consultationId: string,
) {
  return apiFetch<ReopenAnalysisResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/analysis/reopen`,
    {
      method: "POST",
    },
  );
}

export function getInformationSupplementContext(
  consultationId: string,
) {
  return apiFetch<InformationSupplementContextResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/analysis/supplement-context`,
  );
}

export function prepareConsultationReport(
  consultationId: string,
) {
  return apiFetch<ConsultationReportResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/report/prepare`,
    {
      method: "POST",
    },
  );
}

export function getConsultationReport(
  consultationId: string,
) {
  return apiFetch<ConsultationReportResponse>(
    `/consultations/${encodeURIComponent(
      consultationId,
    )}/report`,
  );
}
