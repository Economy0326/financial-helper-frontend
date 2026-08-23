export type EmergencyType =
  | "TRANSFER"
  | "UNKNOWN_PAYMENT"
  | "SUSPICIOUS_APP"
  | "PERSONAL_INFO"
  | "UNKNOWN";

export type EmergencyTypeFixture = {
  value: EmergencyType;
  title: string;
  description: string;
  icon:
    | "transfer"
    | "payment"
    | "app"
    | "personal-info"
    | "unknown";
};

export type EmergencyScenarioFixture = {
  id: string;
  type: EmergencyType;
  scenarioKey: string;
};

export const emergencyTypesFixture: EmergencyTypeFixture[] = [
  {
    value: "TRANSFER",
    title: "돈을 송금했어요",
    description: "보이스피싱 · 사기 계좌로 송금했을 때",
    icon: "transfer",
  },
  {
    value: "UNKNOWN_PAYMENT",
    title: "모르는 결제가 발생했어요",
    description: "카드 · 계좌에서 본인이 하지 않은 결제가 발생했을 때",
    icon: "payment",
  },
  {
    value: "SUSPICIOUS_APP",
    title: "수상한 앱을 설치했어요",
    description: "원격제어 앱 · 악성 앱을 설치했을 때",
    icon: "app",
  },
  {
    value: "PERSONAL_INFO",
    title: "개인정보를 알려줬어요",
    description: "비밀번호 · 인증번호 · 신분정보 등을 전달했을 때",
    icon: "personal-info",
  },
  {
    value: "UNKNOWN",
    title: "잘 모르겠어요",
    description: "어떤 피해인지 정확히 판단하기 어려울 때",
    icon: "unknown",
  },
];

const MOCK_EMERGENCY_DELAY = 300;
const MOCK_EMERGENCY_TYPE_ERROR = false;

let selectedEmergencyScenario:
  | EmergencyScenarioFixture
  | null = null;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getScenarioForType(
  type: EmergencyType,
): EmergencyScenarioFixture {
  // switch => Fixture Server의 역할
  switch (type) {
    case "TRANSFER":
      return {
        id: "emergency-transfer",
        type,
        scenarioKey: "TRANSFER_SCENARIO",
      };

    case "UNKNOWN_PAYMENT":
      return {
        id: "emergency-unknown-payment",
        type,
        scenarioKey: "UNKNOWN_PAYMENT_SCENARIO",
      };

    case "SUSPICIOUS_APP":
      return {
        id: "emergency-suspicious-app",
        type,
        scenarioKey: "SUSPICIOUS_APP_SCENARIO",
      };

    case "PERSONAL_INFO":
      return {
        id: "emergency-personal-info",
        type,
        scenarioKey: "PERSONAL_INFO_SCENARIO",
      };

    case "UNKNOWN":
      return {
        id: "emergency-common",
        type,
        scenarioKey: "COMMON_EMERGENCY_SCENARIO",
      };
  }
}

export async function selectEmergencyTypeFixture(
  type: EmergencyType,
) {
  await delay(MOCK_EMERGENCY_DELAY);

  if (MOCK_EMERGENCY_TYPE_ERROR) {
    throw new Error("Mock emergency type submit error");
  }

  selectedEmergencyScenario =
    getScenarioForType(type);

  return selectedEmergencyScenario;
}

export async function getSelectedEmergencyScenarioFixture() {
  await delay(MOCK_EMERGENCY_DELAY);

  return selectedEmergencyScenario;
}


//Emergency Immediate Action
export type EmergencyActionItemFixture = {
  id: string;
  title: string;
  description: string;
};

export type EmergencyImmediateActionFixture = {
  scenarioId: string;
  type: EmergencyType;
  title: string;
  description: string;
  actionsToDo: EmergencyActionItemFixture[];
  actionsToAvoid: EmergencyActionItemFixture[];
};

export type EmergencyImmediateActionStateFixture =
  | {
      kind: "ready";
      data: EmergencyImmediateActionFixture;
    }
  | {
      kind: "not-selected";
    }
  | {
      kind: "unavailable";
      message: string;
    };

const MOCK_EMERGENCY_ACTION_DELAY = 300;
const MOCK_EMERGENCY_ACTION_LOAD_ERROR = false;

const emergencyImmediateActionsFixture: Record<
  EmergencyType,
  Omit<EmergencyImmediateActionFixture, "scenarioId" | "type">
> = {
  TRANSFER: {
    title: "지금 바로 이렇게 하세요",
    description: "추가 피해를 막는 것이 가장 중요합니다.",
    actionsToDo: [
      {
        id: "transfer-do-1",
        title: "이용 중인 금융회사에 즉시 연락하세요.",
        description:
          "공식 고객센터를 통해 피해 사실을 알리고 필요한 조치를 확인하세요.",
      },
      {
        id: "transfer-do-2",
        title: "관련 비밀번호와 인증수단을 점검하세요.",
        description:
          "추가 접근이 우려된다면 공식 절차에 따라 인증수단을 변경하세요.",
      },
      {
        id: "transfer-do-3",
        title: "피해가 의심되면 공식 기관에 신고하세요.",
        description:
          "경찰과 금융 관련 공식 기관의 안내를 받아 대응을 시작하세요.",
      },
    ],
    actionsToAvoid: [
      {
        id: "transfer-avoid-1",
        title: "추가로 돈을 보내지 마세요.",
        description:
          "확인되지 않은 요구에 따라 추가 송금하지 마세요.",
      },
      {
        id: "transfer-avoid-2",
        title: "상대방이 알려준 링크를 다시 누르지 마세요.",
        description:
          "문자나 메신저로 전달받은 링크 대신 공식 채널을 이용하세요.",
      },
      {
        id: "transfer-avoid-3",
        title: "원격제어 요청에 응하지 마세요.",
        description:
          "알 수 없는 앱 설치나 화면 공유 요청을 중단하세요.",
      },
    ],
  },

  UNKNOWN_PAYMENT: {
    title: "지금 바로 이렇게 하세요",
    description: "추가 결제가 발생하지 않도록 먼저 대응하세요.",
    actionsToDo: [
      {
        id: "payment-do-1",
        title: "카드사 또는 금융회사에 즉시 연락하세요.",
        description:
          "본인이 하지 않은 거래가 있음을 알리고 필요한 조치를 확인하세요.",
      },
      {
        id: "payment-do-2",
        title: "최근 거래 내역을 확인하세요.",
        description:
          "알지 못하는 결제가 추가로 있는지 공식 앱이나 홈페이지에서 확인하세요.",
      },
      {
        id: "payment-do-3",
        title: "계정과 인증수단을 점검하세요.",
        description:
          "필요하다면 공식 절차를 통해 비밀번호와 인증수단을 변경하세요.",
      },
    ],
    actionsToAvoid: [
      {
        id: "payment-avoid-1",
        title: "출처가 불분명한 연락에 응하지 마세요.",
        description:
          "결제 취소를 도와준다며 개인정보를 요구하는 연락을 주의하세요.",
      },
      {
        id: "payment-avoid-2",
        title: "인증번호를 전달하지 마세요.",
        description:
          "누구에게도 문자 인증번호나 금융 인증정보를 알려주지 마세요.",
      },
      {
        id: "payment-avoid-3",
        title: "모르는 링크에서 로그인하지 마세요.",
        description:
          "금융회사의 공식 앱이나 공식 홈페이지를 직접 이용하세요.",
      },
    ],
  },

  SUSPICIOUS_APP: {
    title: "지금 바로 이렇게 하세요",
    description: "추가 접근을 막고 공식 채널을 통해 상태를 확인하세요.",
    actionsToDo: [
      {
        id: "app-do-1",
        title: "금융 계정의 이상 여부를 확인하세요.",
        description:
          "공식 금융 앱이나 홈페이지에서 최근 접속과 거래를 확인하세요.",
      },
      {
        id: "app-do-2",
        title: "중요한 인증수단을 점검하세요.",
        description:
          "필요하다면 안전한 기기와 공식 절차를 이용해 인증정보를 변경하세요.",
      },
      {
        id: "app-do-3",
        title: "의심되는 피해가 있으면 공식 기관에 문의하세요.",
        description:
          "금융회사와 관련 공식 기관을 통해 추가 대응 방법을 확인하세요.",
      },
    ],
    actionsToAvoid: [
      {
        id: "app-avoid-1",
        title: "추가 앱을 설치하지 마세요.",
        description:
          "상대방의 안내에 따라 새로운 앱이나 프로그램을 설치하지 마세요.",
      },
      {
        id: "app-avoid-2",
        title: "원격제어 요청에 응하지 마세요.",
        description:
          "화면 공유나 원격조작 요청을 즉시 중단하세요.",
      },
      {
        id: "app-avoid-3",
        title: "금융정보를 추가로 입력하지 마세요.",
        description:
          "의심되는 화면에 비밀번호나 인증번호를 입력하지 마세요.",
      },
    ],
  },

  PERSONAL_INFO: {
    title: "지금 바로 이렇게 하세요",
    description: "노출된 정보가 추가 피해로 이어지지 않도록 대응하세요.",
    actionsToDo: [
      {
        id: "personal-do-1",
        title: "관련 금융 계정을 점검하세요.",
        description:
          "공식 채널에서 최근 접속이나 이상 거래가 있는지 확인하세요.",
      },
      {
        id: "personal-do-2",
        title: "노출된 인증정보를 변경하세요.",
        description:
          "필요한 경우 안전한 환경에서 비밀번호와 인증수단을 변경하세요.",
      },
      {
        id: "personal-do-3",
        title: "피해가 의심되면 공식 기관에 알리세요.",
        description:
          "금융회사와 관련 기관에 상황을 설명하고 대응 절차를 확인하세요.",
      },
    ],
    actionsToAvoid: [
      {
        id: "personal-avoid-1",
        title: "추가 개인정보를 알려주지 마세요.",
        description:
          "신분정보나 금융정보를 추가로 전달하지 마세요.",
      },
      {
        id: "personal-avoid-2",
        title: "인증번호를 전달하지 마세요.",
        description:
          "문자나 앱으로 받은 인증번호를 다른 사람에게 알려주지 마세요.",
      },
      {
        id: "personal-avoid-3",
        title: "상대방의 재연락을 그대로 믿지 마세요.",
        description:
          "확인이 필요하다면 기관의 공식 연락처를 직접 찾아 연락하세요.",
      },
    ],
  },

  UNKNOWN: {
    title: "지금 바로 이렇게 하세요",
    description:
      "정확한 피해 유형을 모르더라도 추가 피해를 막기 위한 공통 대응부터 확인하세요.",
    actionsToDo: [
      {
        id: "unknown-do-1",
        title: "이용 중인 금융회사의 공식 채널을 확인하세요.",
        description:
          "이상 거래나 계정 문제가 없는지 공식 앱이나 고객센터에서 확인하세요.",
      },
      {
        id: "unknown-do-2",
        title: "최근 금융 거래와 계정 상태를 점검하세요.",
        description:
          "본인이 하지 않은 거래나 이상한 접속이 있는지 살펴보세요.",
      },
      {
        id: "unknown-do-3",
        title: "피해가 의심되면 공식 기관의 도움을 요청하세요.",
        description:
          "특정 피해 유형을 단정하지 말고 현재 상황을 설명해 공식 안내를 받으세요.",
      },
    ],
    actionsToAvoid: [
      {
        id: "unknown-avoid-1",
        title: "추가 송금을 하지 마세요.",
        description:
          "확인되지 않은 요구에 따라 돈을 보내지 마세요.",
      },
      {
        id: "unknown-avoid-2",
        title: "모르는 링크나 앱을 이용하지 마세요.",
        description:
          "문자나 메신저로 전달받은 링크와 앱 설치 요청을 주의하세요.",
      },
      {
        id: "unknown-avoid-3",
        title: "개인정보와 인증정보를 추가로 전달하지 마세요.",
        description:
          "비밀번호, 인증번호 등 민감한 정보를 더 이상 제공하지 마세요.",
      },
    ],
  },
};

export async function getEmergencyImmediateActionFixture(): Promise<EmergencyImmediateActionStateFixture> {
  await delay(MOCK_EMERGENCY_ACTION_DELAY);

  if (MOCK_EMERGENCY_ACTION_LOAD_ERROR) {
    throw new Error("Mock emergency action load error");
  }

  if (!selectedEmergencyScenario) {
    return {
      kind: "not-selected",
    };
  }

  const actionData =
    emergencyImmediateActionsFixture[
      selectedEmergencyScenario.type
    ];

  if (!actionData) {
    return {
      kind: "unavailable",
      message:
        "현재 선택한 상황의 긴급 대응 정보를 제공할 수 없어요.",
    };
  }

  return {
    kind: "ready",
    data: {
      scenarioId: selectedEmergencyScenario.id,
      type: selectedEmergencyScenario.type,
      ...actionData,
    },
  };
}