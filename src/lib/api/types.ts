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