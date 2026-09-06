export type ConsultationCategory =
  | "INSURANCE"
  | "LOAN"
  | "CARD"
  | "UNKNOWN";

export type ConsultationStatus =
  | "IN_PROGRESS"
  | "ANALYZING"
  | "NEEDS_MORE_INFO"
  | "COMPLETED"
  | "FAILED";

export type ConsultationStep =
  | "CATEGORY"
  | "SITUATION"
  | "FOLLOW_UP"
  | "SUMMARY"
  | "ANALYSIS"
  | "REPORT";

export type SessionResponse = {
  guest: boolean;
  hasActiveConsultation: boolean;
};

export type ConsultationCreateResponse = {
  consultationId: string;
  status: ConsultationStatus;
  currentStep: ConsultationStep;
};

export type ActiveConsultationResponse = {
  consultationId: string;
  category: ConsultationCategory | null;
  status: ConsultationStatus;
  currentStep: ConsultationStep;
  updatedAt: string;
};

export type ConsultationDetailResponse = {
  consultationId: string;
  category: ConsultationCategory | null;
  situationText: string | null;
  status: ConsultationStatus;
  currentStep: ConsultationStep;
  updatedAt: string;
};

export type UpdateCategoryResponse = {
  currentStep: ConsultationStep;
};

export type UpdateSituationResponse = {
  consultationId: string;
  currentStep: ConsultationStep;
};

export type FollowUpOptionResponse = {
  value: string;
  label: string;
  description: string;
};

export type FollowUpQuestionResponse = {
  id: string;
  question: string;
  description: string;
  options: FollowUpOptionResponse[];
};

export type FollowUpStateResponse = {
  kind:
    | "question"
    | "complete"
    | "not-prepared";

  question:
    | FollowUpQuestionResponse
    | null;

  // 사용자가 질문 상태면 1,2,3 같은 number
  currentQuestionNumber:
    | number
    | null;

  totalQuestions:
    | number
    | null;

  savedAnswer:
    | string
    | null;
};

export type ConsultationSummaryPayload = {
  headline: string;
  summaryText: string;
  keyPoints: string[];
};

export type ConsultationSummaryStateResponse = {
  kind: "ready" | "not-prepared";
  summary:
    | ConsultationSummaryPayload
    | null;
};

export type ConfirmConsultationSummaryResponse = {
  consultationId: string;
  nextStep: "ANALYSIS";
};

export type AnalysisStatus =
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "NEEDS_MORE_INFO"
  | "INSUFFICIENT_INFORMATION"
  | "FAILED";

export type AnalysisAdditionalInformation = {
  topic: string;
  reason: string;
};

export type AnalysisStateResponse = {
  status: AnalysisStatus;
  attemptCount: number;

  informationSupplementCount: number;

  canSupplementInformation: boolean;

  additionalInformationNeeded:
    AnalysisAdditionalInformation[];
};

export type ReopenAnalysisResponse = {
  consultationId: string;
  nextStep: "SITUATION";
};

export type InformationSupplementContextResponse = {
  active: boolean;
  supplementCount: number;

  neededInformation: {
    topic: string;
    reason: string;
  }[];
};

export type ApiFieldError = {
  field: string;
  reason: string;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    fieldErrors: ApiFieldError[];
    requestId: string;
  };
};