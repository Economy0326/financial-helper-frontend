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
  },
} as const;