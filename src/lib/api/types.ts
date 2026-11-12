export type ConsultationCategory =
  | "INSURANCE"
  | "LOAN"
  | "CARD"
  | "FINANCIAL_FRAUD"
  | "UNKNOWN";

export type ConsultationScenario =
  | "CARD_LOSS_UNAUTHORIZED_USE"
  | "VOICE_PHISHING_SUSPICIOUS_TRANSFER"
  | "UNAUTHORIZED_ACCOUNT_TRANSFER"
  | "PERSONAL_INFO_SMISHING_MALICIOUS_APP"
  | "UNKNOWN";

export type ConsultationStatus =
  | "IN_PROGRESS"
  | "ANALYZING"
  | "NEEDS_MORE_INFO"
  | "COMPLETED"
  | "ABANDONED"
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
  authenticated?: boolean;
  accountId?: string | null;
  provider?: "KAKAO" | "NAVER" | null;
};

export type AccountOverviewResponse = {
  accountId: string;
  provider: "KAKAO" | "NAVER";
  displayName: string | null;
  activeConsultation: {
    consultationId: string;
    category: ConsultationCategory | null;
    scenario?: ConsultationScenario | null;
    status: ConsultationStatus;
    currentStep: ConsultationStep;
    updatedAt: string;
  } | null;
  quota: { used: number; limit: number; nextAvailableAt: string | null };
};

export type AccountConsultationHistoryItem = {
  consultationId: string;
  category: ConsultationCategory | null;
  scenario?: ConsultationScenario | null;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
  reportId: string | null;
  reportGeneratedAt: string | null;
  actionReportAvailable?: boolean;
  informationReportAvailable?: boolean;
  informationReportId?: string | null;
  informationReportGeneratedAt?: string | null;
};

export type AccountEmergencyHistoryItem = {
  id: string;
  emergencyType: EmergencyType;
  scenarioVersion: string;
  viewedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type ConsultationCreateResponse = {
  consultationId: string;
  status: ConsultationStatus;
  currentStep: ConsultationStep;
};

export type ActiveConsultationResponse = {
  consultationId: string;
  category: ConsultationCategory | null;
  scenario?: ConsultationScenario | null;
  status: ConsultationStatus;
  currentStep: ConsultationStep;
  updatedAt: string;
};

export type ActiveConsultationStateResponse = {
  active: boolean;
  consultation: ActiveConsultationResponse | null;
};

export type ConsultationDetailResponse = {
  consultationId: string;
  category: ConsultationCategory | null;
  scenario?: ConsultationScenario | null;
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
  caseInputRevision: number;
  scenarioAlignment: "SELECTED_SCENARIO_MATCH" | "SUPPORTED_SCENARIO_MISMATCH" | "NEEDS_CLARIFICATION";
  selectedScenario: ConsultationScenario | null;
  suggestedScenario: ConsultationScenario | null;
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
  inputType?:
    | "YES_NO"
    | "YES_NO_UNKNOWN"
    | "INSTITUTION_SELECT"
    | "ENUM_SELECT"
    | "DATE"
    | "SHORT_TEXT";
  options: FollowUpOptionResponse[];
};

export type FollowUpStateResponse = {
  kind: "question" | "complete" | "not-prepared" | "unsupported" | "insufficient_information" | "version_blocked";

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
  unsupportedReason: string | null;
  blockingFact?: { key: string; label: string } | null;
  message?: string | null;
  versionBlockReason?: string | null;
  // Structured Follow-up includes this field; the legacy response does not.
  caseInputRevision?: number;
};

export type ConfirmSuggestedScenarioResponse = {
  selectedScenario: ConsultationScenario;
  scenarioAlignment: "SELECTED_SCENARIO_MATCH";
  caseInputRevision: number;
  nextStep: ConsultationStep;
};

export type ConsultationSummaryPayload = {
  headline: string;
  summaryText: string;
  keyPoints: string[];
  facts: Array<{
    key: string;
    label: string | null;
    value: string;
    displayValue: string | null;
  }>;
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
  | "UNSUPPORTED_SCOPE"
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

export type AnalysisSafeAction = {
  actionId: string;
  title: string;
  description: string;
};

export type AnalysisStateResponse = {
  status: AnalysisStatus;
  failureCode: string | null;
  evidenceFailureReason:
    | "REVIEW_REQUIRED"
    | "TEMPORARY_UNAVAILABLE"
    | "COVERAGE_GAP"
    | null;
  attemptCount: number;

  informationSupplementCount: number;

  canSupplementInformation: boolean;

  additionalInformationNeeded:
    AnalysisAdditionalInformation[];

  safeActions: AnalysisSafeAction[];
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

export type ConsultationReportResponse = {
  kind: "ready" | "not-prepared";

  report: {
    headline: string;
    caseSummary: string;

    firstAction: {
      actionId?: string | null;
      title: string;
      description: string;
    };

    keyIssues: {
      title: string;
      explanation: string;
    }[];

    actionSteps: {
      actionId?: string | null;
      order: number;
      title: string;
      description: string;
    }[];

    actionConsequences: {
      action: string;
      consequence: string;
    }[];

    requiredDocuments: {
      documentId?: string | null;
      name: string;
      reason: string;
    }[];

    terms: {
      term: string;
      explanation: string;
    }[];

    complaintDraft: {
      subject: string;
      body: string;
    };

    similarCases: unknown[];
    citations: {
      evidenceId: string;
      locator: string;
      label?: string | null;
    }[];
  } | null;

  evidence: {
    status:
      | "NOT_AVAILABLE_IN_AI_V1"
      | "GROUNDED_CARD";

    message: string;
  };
};

export type InformationRelatedText = { chunkId: string; locator: string; text: string };
export type InformationEvidence = {
  sourceDocumentId: string; documentVersion: number; rawSha256: string; supportChunkId: string;
  applicabilityReviewId: string; scopeKind: string; organizationName: string; title: string;
  canonicalUrl: string; articleReference: string | null; pageReference: string | null;
  supportLocator: string; supportText: string; applicableInstitution: string | null;
  applicableProduct: string | null; applicabilityStartDate: string | null;
  applicabilityEndDate: string | null; conditions: InformationRelatedText[]; exceptions: InformationRelatedText[];
  questionNumber?: number | null; metadataSourceUrl?: string | null;
};
export type InformationNextAction = { title: string; description: string; sourceUrl: string; supportChunkId: string };
export type InformationReportResponse = {
  evidenceProvenance?: Record<string, string>;
  consultationId: string; status: string; reason: string | null; generatedAt: string | null;
  snapshot: null | {
    caseInputRevision: number; followUpAnswerRevision: number; scenario: string;
    confirmedFacts: Array<{ key: string; value: string | null }>;
    missingFacts: string[]; coverageGaps: string[]; sourceIntegrityStatus: string;
    humanScopeReviewStatus: string; caseApplicabilityStatus: string;
    financialTopic?: FinancialTopic | null; referenceDate?: string | null;
  };
  selectedEvidence: InformationEvidence[];
  nextActions?: InformationNextAction[];
  explanations: Array<{ supportChunkId: string; mode: string; easyText: string;
    conditions: InformationRelatedText[]; exceptions: InformationRelatedText[] }>;
};

export type FinancialTopic = "CARD_PAYMENTS" | "DEPOSITS_ACCOUNTS" | "LOANS_CREDIT" |
  "INSURANCE" | "INVESTMENTS_SECURITIES" | "FRAUD_SECURITY" | "CONSUMER_RIGHTS_DISPUTES";

export type InformationIntakeStatus = "SCENARIO_CONFIRMATION_REQUIRED" | "NEEDS_CLARIFICATION" |
  "UNSUPPORTED_SCOPE" | "READY" | "TOPIC_CONFIRMATION_REQUIRED" |
  "TOPIC_MISMATCH_CONFIRMATION_REQUIRED" | "MULTIPLE_TOPICS" |
  "OUT_OF_SCOPE_NON_FINANCIAL" | "INPUT_NOT_UNDERSTOOD" |
  "UNSUPPORTED_FINANCIAL_TOPIC" | "TOPIC_CONFIRMED_NO_SEARCH" | "TOPIC_CONFIRMED_SEARCH_AVAILABLE";

export type InformationIntakeState = {
  consultationId: string;
  caseInputRevision: number;
  status: InformationIntakeStatus;
  situationText: string | null;
  scenarioCandidates: ConsultationScenario[];
  confirmedScenario: ConsultationScenario | null;
  topicCandidates: FinancialTopic[];
  selectedTopic: FinancialTopic | null;
  confirmedTopic: FinancialTopic | null;
  routingStatus: InformationIntakeStatus | "EMERGENCY_RECOMMENDED";
  suggestedRoute: "ACTION" | "INFORMATION" | "EMERGENCY" | "NONE";
  evidenceAvailability: "NOT_EVALUATED" | "NO_APPROVED_READY_EVIDENCE" | "REVIEWED_READY_CORPUS";
  generalInformationSearchAvailable: boolean;
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
    nextAvailableAt?: string | null;
  };
};

export type EmergencyType =
  | "TRANSFER"
  | "UNKNOWN_PAYMENT"
  | "SUSPICIOUS_APP"
  | "PERSONAL_INFO"
  | "UNKNOWN";

export type EmergencyTypeIcon =
  | "transfer"
  | "payment"
  | "app"
  | "personal-info"
  | "unknown";

export type EmergencyTypeOptionResponse = {
  value: EmergencyType;
  title: string;
  description: string;
  icon: EmergencyTypeIcon;
};

export type EmergencySelectionResponse = {
  selectedType: EmergencyType;
  scenarioKey: string;
};

export type EmergencyScenarioActionItem = {
  id: string;
  title: string;
  description: string;
};

export type EmergencyScenarioContact = {
  id: string;
  name: string;
  description: string;
  phoneLabel: string | null;
  phoneHref: string | null;
  icon:
    | "police"
    | "financial-company"
    | "card-company"
    | "official";
};

export type EmergencyScenarioEvidence = {
  id: string;
  label: string;
};

export type EmergencyScenario = {
  scenarioId: string;
  type: EmergencyType;
  scenarioKey: string;
  title: string;
  description: string;
  actionsToDo: EmergencyScenarioActionItem[];
  actionsToAvoid: EmergencyScenarioActionItem[];
  contacts: EmergencyScenarioContact[];
  evidence: EmergencyScenarioEvidence[];
};

export type EmergencyScenarioStateResponse =
  | {
      kind: "not-selected";
      scenario: null;
    }
  | {
      kind: "ready";
      scenario: EmergencyScenario;
    };
