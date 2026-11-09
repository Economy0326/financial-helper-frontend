import { apiFetch } from "./client";
import type { InformationReportResponse, InformationIntakeState, ConsultationScenario as IntakeScenario, FinancialTopic } from "./types";

export function getInformationIntake(id: string) {
  return apiFetch<InformationIntakeState>(`/consultations/${encodeURIComponent(id)}/information-intake`);
}

export function updateInformationIntake(id: string, situationText: string, expectedCaseInputRevision: number, selectedTopic?: FinancialTopic | null) {
  return apiFetch<InformationIntakeState>(`/consultations/${encodeURIComponent(id)}/information-intake`, {
    method: "PUT", body: { situationText, expectedCaseInputRevision, ...(selectedTopic ? { selectedTopic } : {}) },
  });
}

export function confirmFinancialTopic(id: string, topic: FinancialTopic, expectedCaseInputRevision: number) {
  return apiFetch<InformationIntakeState>(`/consultations/${encodeURIComponent(id)}/information-intake/confirm-topic`, {
    method: "POST", body: { topic, expectedCaseInputRevision },
  });
}

export function confirmInformationIntake(id: string, scenario: IntakeScenario, expectedCaseInputRevision: number) {
  return apiFetch<InformationIntakeState>(`/consultations/${encodeURIComponent(id)}/information-intake/confirm`, {
    method: "POST", body: { scenario, expectedCaseInputRevision },
  });
}

export function getInformationReport(id: string) {
  return apiFetch<InformationReportResponse>(`/consultations/${encodeURIComponent(id)}/information-report`);
}

export function prepareInformationReport(id: string, expectedCaseInputRevision: number) {
  return apiFetch<InformationReportResponse>(`/consultations/${encodeURIComponent(id)}/information-report/prepare`, {
    method: "POST", body: { expectedCaseInputRevision },
  });
}

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
  ConfirmSuggestedScenarioResponse,
} from "./types";

export function startConsultation(startNew = false) {
  return apiFetch<ConsultationCreateResponse>(
    `/consultations${startNew ? "?new=true" : ""}`,
    {
      method: "POST",
    },
  );
}

export function confirmSuggestedScenario(consultationId: string, scenario: ConsultationScenario, expectedCaseInputRevision: number) {
  return apiFetch<ConfirmSuggestedScenarioResponse>(`/consultations/${encodeURIComponent(consultationId)}/scenario/confirm`, {
    method: "POST", body: { scenario, expectedCaseInputRevision },
  });
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
    `/consultations/${encodeURIComponent(consultationId)}/procedure-follow-up/prepare`,
    {
      method: "POST",
    },
  );
}

export function getFollowUpState(
  consultationId: string,
  questionNumber?: number | null,
) {
  void questionNumber;

  return apiFetch<FollowUpStateResponse>(
    `/consultations/${encodeURIComponent(consultationId)}/procedure-follow-up`,
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
    )}/procedure-follow-up/questions/${encodeURIComponent(
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
