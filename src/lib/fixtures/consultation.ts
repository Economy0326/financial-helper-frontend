// Situation Input
export type SituationFixture = {
  content: string;
};

let savedSituation: SituationFixture | null = null;

const MOCK_DELAY = 300;
const MOCK_SITUATION_SUBMIT_ERROR = false;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getSituationFixture() {
  await delay(MOCK_DELAY);

  return savedSituation;
}

export async function saveSituationFixture(content: string) {
  await delay(MOCK_DELAY);

  if (MOCK_SITUATION_SUBMIT_ERROR) {
    throw new Error("Mock situation submit error");
  }

  savedSituation = {
    content,
  };

  return savedSituation;
}

// Consultation Summary
export type ConsultationSummaryFixture = {
  category: string;
  situation: string;
  keyPoints: string[];
};

export type SummaryStateFixture =
  | {
      kind: "ready";
      summary: ConsultationSummaryFixture;
    }
  | {
      kind: "generation-failed";
    };

const MOCK_SUMMARY_DELAY = 300;
const MOCK_SUMMARY_GENERATION_FAILURE = false;
const MOCK_SUMMARY_CONFIRM_ERROR = false;

const consultationSummaryFixture: ConsultationSummaryFixture = {
  category: "보험",
  situation:
    "보험 계약을 해지하려고 했는데 예상했던 것보다 해지환급금이 적어서 이유를 확인하고 싶어요.",
  keyPoints: [
    "보험 계약 해지를 고려하고 있어요.",
    "예상보다 해지환급금이 적다고 느끼고 있어요.",
    "해지환급금 산정 기준과 확인 방법을 알고 싶어 해요.",
  ],
};

export async function getSummaryFixture(): Promise<SummaryStateFixture> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_SUMMARY_DELAY);
  });

  if (MOCK_SUMMARY_GENERATION_FAILURE) {
    return {
      kind: "generation-failed",
    };
  }

  return {
    kind: "ready",
    summary: consultationSummaryFixture,
  };
}

export async function confirmSummaryFixture() {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_SUMMARY_DELAY);
  });

  if (MOCK_SUMMARY_CONFIRM_ERROR) {
    throw new Error("Mock summary confirmation error");
  }

  return {
    confirmed: true,
  };
}

// Consultation Analysis
export type AnalysisStatus =
  | "NOT_STARTED"
  | "STARTING"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED"
  | "NEEDS_MORE_INFO";

export type AnalysisStateFixture = {
  status: AnalysisStatus;
  startedAt: number | null;
  message?: string;
  nextPath?: string;
};

const MOCK_ANALYSIS_DELAY = 300;

/**
 * 상태 테스트용.
 *
 * 기본 구현에서는 false로 둔다.
 */
const MOCK_ANALYSIS_NETWORK_ERROR = false;
const MOCK_ANALYSIS_START_ERROR = false;
const MOCK_ANALYSIS_RETRY_ERROR = false;

/**
 * 아래 값을 true로 변경하면 분석 실패 상태를 확인할 수 있다.
 */
const MOCK_ANALYSIS_RESULT_FAILURE = false;

/**
 * 추가 정보 필요 State 확인용.
 */
const MOCK_ANALYSIS_NEEDS_MORE_INFO = false;

/**
 * 실제 서비스의 분석 시간을 의미하지 않는다.
 * Roadmap 7 화면 State 확인을 위한 Fixture 시간이다.
 */
const MOCK_ANALYSIS_COMPLETION_DELAY = 6000;

let analysisStateFixture: AnalysisStateFixture = {
  status: "NOT_STARTED",
  startedAt: null,
};

export async function startAnalysisFixture() {
  await delay(MOCK_ANALYSIS_DELAY);

  if (MOCK_ANALYSIS_START_ERROR) {
    throw new Error("Mock analysis start error");
  }

  analysisStateFixture = {
    status: "ANALYZING",
    startedAt: Date.now(),
  };

  return analysisStateFixture;
}

export async function getAnalysisStatusFixture() {
  await delay(MOCK_ANALYSIS_DELAY);

  if (MOCK_ANALYSIS_NETWORK_ERROR) {
    throw new Error("Mock analysis network error");
  }

  if (
    analysisStateFixture.status === "ANALYZING" &&
    analysisStateFixture.startedAt
  ) {
    const elapsed =
      Date.now() - analysisStateFixture.startedAt;

    if (elapsed >= MOCK_ANALYSIS_COMPLETION_DELAY) {
      if (MOCK_ANALYSIS_NEEDS_MORE_INFO) {
        analysisStateFixture = {
          status: "NEEDS_MORE_INFO",
          startedAt: analysisStateFixture.startedAt,
          message:
            "분석을 계속하려면 추가 정보가 필요해요.",
          nextPath: "/consultation/follow-up",
        };
      } else if (MOCK_ANALYSIS_RESULT_FAILURE) {
        analysisStateFixture = {
          status: "FAILED",
          startedAt: analysisStateFixture.startedAt,
          message:
            "분석 과정에서 문제가 발생했어요.",
        };
      } else {
        analysisStateFixture = {
          status: "COMPLETED",
          startedAt: analysisStateFixture.startedAt,
        };
      }
    }
  }

  return analysisStateFixture;
}

export async function retryAnalysisFixture() {
  await delay(MOCK_ANALYSIS_DELAY);

  if (MOCK_ANALYSIS_RETRY_ERROR) {
    throw new Error("Mock analysis retry error");
  }

  analysisStateFixture = {
    status: "ANALYZING",
    startedAt: Date.now(),
  };

  return analysisStateFixture;
}

// Solution Report
const MOCK_REPORT_DELAY = 300;

export type ReportSourceFixture = {
  id: string;
  organization: string;
  title: string;
  url: string;
  checkedAt: string;
};

export type ReportPriorityActionFixture = {
  id: string;
  title: string;
  description: string;
  citationIds: string[];
};

export type ReportProcedureFixture = {
  step: number;
  title: string;
  description: string;
};

export type ReportSimilarCaseFixture = {
  id: string;
  title: string;
  summary: string;
  result: string;
  duration: string;
};

export type ReportGlossaryFixture = {
  term: string;
  description: string;
};

export type SolutionReportFixture = {
  title: string;
  description: string;

  priorityActions: ReportPriorityActionFixture[];

  situationSummary: string[];

  keyIssue: string;

  expectedProcedure: ReportProcedureFixture[];

  requiredDocuments: string[];

  similarCases: ReportSimilarCaseFixture[];

  glossary: ReportGlossaryFixture[];

  sources: ReportSourceFixture[];
};

export type SolutionReportStateFixture =
  | {
      kind: "ready";
      report: SolutionReportFixture;
    }
  | {
      kind: "not-ready";
    }
  | {
      kind: "unavailable";
      message: string;
    };

const MOCK_REPORT_LOAD_ERROR = false;

const MOCK_REPORT_STATE:
  | "READY"
  | "NOT_READY"
  | "UNAVAILABLE" = "READY";

const solutionReportFixture: SolutionReportFixture = {
  title: "AI 분석 결과를 바탕으로 해결 방법을 정리했어요",
  description:
    "아래 내용을 확인하시고 필요한 조치를 진행해 보세요.",

  priorityActions: [
    {
      id: "priority-1",
      title: "보험사에 해지환급금 산정 내역을 요청하세요.",
      description:
        "어떤 기준과 항목으로 해지환급금이 계산되었는지 먼저 확인해 보세요.",
      citationIds: ["source-fss"],
    },
    {
      id: "priority-2",
      title: "보험사의 답변과 계약 내용을 비교해 보세요.",
      description:
        "약관과 산정 내역, 보험사의 설명 사이에 차이가 있는지 확인해 보세요.",
      citationIds: ["source-law"],
    },
    {
      id: "priority-3",
      title: "이해가 되지 않는 부분은 공식 기관에 도움을 요청하세요.",
      description:
        "직접 해결하기 어렵다면 금융 관련 공식 기관의 상담 절차를 확인할 수 있어요.",
      citationIds: ["source-fss"],
    },
  ],

  situationSummary: [
    "보험 계약 해지를 고려하고 있어요.",
    "해지환급금이 예상보다 적다고 느끼고 있어요.",
    "해지환급금이 어떻게 산정되었는지 확인하고 싶어 해요.",
  ],

  keyIssue:
    "해지환급금이 예상보다 적게 산정된 이유와 그 산정 방식이 계약 내용 및 관련 기준에 맞는지 확인하는 것이 핵심이에요.",

  expectedProcedure: [
    {
      step: 1,
      title: "보험회사에 자료 요청",
      description:
        "해지환급금 산정 내역과 관련 계약 자료를 요청해 확인합니다.",
    },
    {
      step: 2,
      title: "답변 및 산정 근거 확인",
      description:
        "보험사의 설명과 약관, 산정 근거를 비교해 확인합니다.",
    },
    {
      step: 3,
      title: "필요하면 이의제기 또는 분쟁조정",
      description:
        "이해되지 않는 내용이 계속된다면 공식 기관의 상담이나 분쟁조정 절차를 검토합니다.",
    },
  ],

  requiredDocuments: [
    "보험 계약 관련 서류",
    "보험사 답변 내용",
    "납입 또는 해지 관련 내역",
    "해지환급금 산정 내역서",
  ],

  similarCases: [
    {
      id: "case-1",
      title: "산정 기준 확인 후 환급금 재검토",
      summary:
        "계약자가 보험사에 산정 기준과 공제 내역을 요청해 환급금 계산 내용을 다시 확인한 사례예요.",
      result: "산정 내용 재확인",
      duration: "처리 기간은 사례별로 다름",
    },
    {
      id: "case-2",
      title: "약관 비교 후 공식 기관 상담",
      summary:
        "보험사 답변과 계약 내용을 비교한 뒤 추가 확인이 필요한 부분을 공식 상담 절차로 검토한 사례예요.",
      result: "공식 상담 진행",
      duration: "처리 기간은 사례별로 다름",
    },
  ],

  glossary: [
    {
      term: "해지환급금",
      description:
        "보험 계약을 중도에 해지할 때 계약 조건에 따라 지급될 수 있는 금액을 의미해요.",
    },
    {
      term: "분쟁조정",
      description:
        "금융회사와 소비자 사이의 분쟁을 해결하기 위해 공식 기관의 조정을 요청하는 절차예요.",
    },
  ],

  sources: [
    {
      id: "source-fss",
      organization: "금융감독원",
      title: "금융소비자 관련 공식 안내",
      url: "https://www.fss.or.kr/",
      checkedAt: "Roadmap 7 Fixture",
    },
    {
      id: "source-law",
      organization: "국가법령정보센터",
      title: "보험 관련 법령 및 제도 확인",
      url: "https://www.law.go.kr/",
      checkedAt: "Roadmap 7 Fixture",
    },
  ],
};

export async function getSolutionReportFixture(): Promise<SolutionReportStateFixture> {
  await delay(MOCK_REPORT_DELAY);

  if (MOCK_REPORT_LOAD_ERROR) {
    throw new Error("Mock report load error");
  }

  if (MOCK_REPORT_STATE === "NOT_READY") {
    return {
      kind: "not-ready",
    };
  }

  if (MOCK_REPORT_STATE === "UNAVAILABLE") {
    return {
      kind: "unavailable",
      message:
        "현재 이 상담의 해결 리포트를 제공할 수 없어요.",
    };
  }

  return {
    kind: "ready",
    report: solutionReportFixture,
  };
}