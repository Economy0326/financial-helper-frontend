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

// AI Follow-up
export type FollowUpOptionFixture = {
  value: string;
  label: string;
  description: string;
};

export type FollowUpQuestionFixture = {
  id: string;
  question: string;
  description: string;
  options: FollowUpOptionFixture[];
};

export type FollowUpStateFixture =
  | {
      kind: "question";
      question: FollowUpQuestionFixture;
      currentQuestionNumber: number;
      totalQuestions: number;
      savedAnswer: string | null;
    }
  | {
      kind: "complete";
    }
  | {
      kind: "none";
    };

const followUpQuestionsFixture: FollowUpQuestionFixture[] = [
  {
    id: "contract-status",
    question: "보험 계약을 해지하셨나요?",
    description:
      "해당되는 내용을 선택해 주세요. 하나를 선택한 뒤 다음으로 넘어가요.",
    options: [
      {
        value: "YES",
        label: "네, 해지했습니다",
        description: "계약을 해지한 적이 있어요.",
      },
      {
        value: "NO",
        label: "아니요, 해지하지 않았어요",
        description: "아직 계약이 유지되고 있어요.",
      },
      {
        value: "UNKNOWN",
        label: "기억이 나지 않아요",
        description: "정확히 기억나지 않아요.",
      },
    ],
  },
  {
    id: "refund-details-request",
    question: "해지환급금 산정 내역을 확인하셨나요?",
    description:
      "현재 상황과 가장 가까운 항목을 선택해 주세요.",
    options: [
      {
        value: "YES",
        label: "네, 확인했습니다",
        description: "보험사에서 산정 내역을 확인했어요.",
      },
      {
        value: "NO",
        label: "아직 확인하지 않았어요",
        description: "산정 내역을 아직 확인하지 않았어요.",
      },
      {
        value: "UNKNOWN",
        label: "잘 모르겠어요",
        description: "어떤 자료인지 잘 모르겠어요.",
      },
    ],
  },
];

const MOCK_FOLLOW_UP_LOAD_ERROR = false;
const MOCK_FOLLOW_UP_SUBMIT_ERROR = false;
const MOCK_NO_FOLLOW_UP = false;

let currentFollowUpIndex = 0;

const savedFollowUpAnswers: Record<string, string> = {};

function buildFollowUpState(): FollowUpStateFixture {
  if (MOCK_NO_FOLLOW_UP) {
    return {
      kind: "none",
    };
  }

  if (currentFollowUpIndex >= followUpQuestionsFixture.length) {
    return {
      kind: "complete",
    };
  }

  const question = followUpQuestionsFixture[currentFollowUpIndex];

  return {
    kind: "question",
    question,
    currentQuestionNumber: currentFollowUpIndex + 1,
    totalQuestions: followUpQuestionsFixture.length,
    savedAnswer: savedFollowUpAnswers[question.id] ?? null,
  };
}

export async function getFollowUpStateFixture() {
  await delay(MOCK_DELAY);

  if (MOCK_FOLLOW_UP_LOAD_ERROR) {
    throw new Error("Mock follow-up load error");
  }

  return buildFollowUpState();
}

export async function saveFollowUpAnswerFixture(input: {
  questionId: string;
  answer: string;
}) {
  await delay(MOCK_DELAY);

  if (MOCK_FOLLOW_UP_SUBMIT_ERROR) {
    throw new Error("Mock follow-up submit error");
  }

  savedFollowUpAnswers[input.questionId] = input.answer;

  currentFollowUpIndex += 1;

  return buildFollowUpState();
}

export async function moveToPreviousFollowUpQuestionFixture() {
  await delay(MOCK_DELAY);

  if (currentFollowUpIndex <= 0) {
    return {
      kind: "previous-step",
    } as const;
  }

  currentFollowUpIndex -= 1;

  return buildFollowUpState();
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