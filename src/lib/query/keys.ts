export const queryKeys = {
  session: {
    all: ["session"] as const,
  },

  emergency: {
    all: ["emergency"] as const,

    types: () =>
      [
        "emergency",
        "types",
      ] as const,

    scenario: () =>
      [
        "emergency",
        "scenario",
      ] as const,
  },

  consultations: {
    all: ["consultations"] as const,

    active: () =>
      [
        "consultations",
        "active",
      ] as const,

    detail: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "detail",
        consultationId,
      ] as const,

    followUpRoot: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "follow-up",
        consultationId,
      ] as const,

    followUp: (
      consultationId: string,
      questionNumber?: number | null,
    ) =>
      [
        "consultations",
        "follow-up",
        consultationId,
        questionNumber ?? "current",
      ] as const,

    summaryRoot: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "summary",
        consultationId,
      ] as const,

    summary: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "summary",
        consultationId,
        "current",
      ] as const,

    analysisRoot: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "analysis",
        consultationId,
      ] as const,

    analysis: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "analysis",
        consultationId,
        "current",
      ] as const,

    analysisSupplement: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "analysis",
        consultationId,
        "supplement-context",
      ] as const,

    reportRoot: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "report",
        consultationId,
      ] as const,

    report: (
      consultationId: string,
    ) =>
      [
        "consultations",
        "report",
        consultationId,
        "current",
      ] as const,
  },
} as const;