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