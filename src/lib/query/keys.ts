export const queryKeys = {
  session: {
    all: ["session"] as const,
  },

  consultations: {
    all: ["consultations"] as const,

    active: () =>
      [
        "consultations",
        "active",
      ] as const,

    detail: (consultationId: string) =>
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
  },
} as const;