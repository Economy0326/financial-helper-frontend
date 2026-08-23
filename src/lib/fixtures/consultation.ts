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