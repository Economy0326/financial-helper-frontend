import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  confirmConsultationSummary,
  getActiveConsultation,
  getConsultation,
  getConsultationSummary,
  getConsultationAnalysis,
  getFollowUpState,
  prepareConsultationSummary,
  prepareFollowUp,
  startConsultation,
  startConsultationAnalysis,
  updateConsultationCategory,
  updateConsultationSituation,
  updateFollowUpAnswer,
  reopenConsultationAnalysis,
  retryConsultationAnalysis,
} from "@/lib/api/consultation";

import type {
  ConsultationCategory,
} from "@/lib/api/types";

import { queryKeys } from "./keys";

import {
  queryRetryDelay,
  shouldRetryQuery,
} from "./retry";

import {
  ApiResponseError,
} from "@/lib/api/errors";

// 상담이 이미 존재할 경우
export function useActiveConsultationQuery(
  enabled = true,
) {
  return useQuery({
    queryKey:
      queryKeys.consultations.active(),

    queryFn: getActiveConsultation,

    // 애초에 Cookie가 없는 첫 방문에서는 Active 호출 무의미
    enabled,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

// 상담 세부사항
export function useConsultationDetailQuery(
  consultationId: string | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.consultations.detail(
      consultationId ?? "pending",
    ),

    queryFn: () => {
      if (!consultationId) {
        throw new Error(
          "Consultation ID is required.",
        );
      }

      return getConsultation(
        consultationId,
      );
    },

    enabled: Boolean(consultationId),

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

// 첫 상담 생성
export function useStartConsultationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startConsultation,

    onSuccess: async () => {
      // 기존 Consultation Cache를 먼저 제거
      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations.all,
      })
      // Promise로 session과 active 한 번에 invalidate
      await Promise.all([
        // 상담 생성 성공하면 데이터가 최신이 아닐 확률이 높으니 성공 이후 invalidate
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.session.all,
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),
      ]);
    },
  });
}

// Category 성공 후
type UpdateCategoryVariables = {
  consultationId: string;
  category: ConsultationCategory;
};

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
      category,
    }: UpdateCategoryVariables) =>
      updateConsultationCategory(
        consultationId,
        category,
      ),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.session.all,
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },

    onError: (error) => {
      if (
        error instanceof ApiResponseError &&
        error.code ===
          "GUEST_SESSION_EXPIRED"
      ) {
        queryClient.removeQueries({
          queryKey:
            queryKeys.consultations.all,
        });

        void queryClient.invalidateQueries({
          queryKey:
            queryKeys.session.all,
        });
      }
    },
  });
}

// Situation 성공 후
type UpdateSituationVariables = {
  consultationId: string;
  situationText: string;
};

export function useUpdateSituationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
      situationText,
    }: UpdateSituationVariables) =>
      updateConsultationSituation(
        consultationId,
        situationText,
      ),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.session.all,
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },

    onError: (error) => {
      if (
        error instanceof ApiResponseError &&
        error.code ===
          "GUEST_SESSION_EXPIRED"
      ) {
        queryClient.removeQueries({
          queryKey:
            queryKeys.consultations.all,
        });

        void queryClient.invalidateQueries({
          queryKey:
            queryKeys.session.all,
        });
      }
    },
  });
}

// Follow-up 관련
export function useFollowUpStateQuery(
  consultationId:
    | string
    | null
    | undefined,
  questionNumber?: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey:
      queryKeys.consultations.followUp(
        consultationId ?? "pending",
        questionNumber,
      ),

    queryFn: () => {
      if (!consultationId) {
        throw new Error(
          "Consultation ID is required.",
        );
      }

      return getFollowUpState(
        consultationId,
        questionNumber,
      );
    },

    // consultationId가 준비되고 조회가 허용된 경우에만 Query 실행
    enabled:
      Boolean(consultationId) &&
      enabled,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

type PrepareFollowUpVariables = {
  consultationId: string;
};

export function usePrepareFollowUpMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: PrepareFollowUpVariables) =>
      // prepareFollowUp -> 실제 API 호출
      prepareFollowUp(
        consultationId,
      ),

    onSuccess: async (
      // variables -> 입력값, data -> API 응답값
      data,
      variables,
    ) => {
      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations
            // Root Query로 전체 캐시 제거
            .followUpRoot(
              variables.consultationId,
            ),
      });

      queryClient.setQueryData(
        // prepare 응답으로 받은 최신 current Follow-up 상태만 캐시에 저장
        queryKeys.consultations.followUp(
          variables.consultationId,
          null,
        ),
        data,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },

    onError: (error) => {
      if (
        error instanceof ApiResponseError &&
        error.code ===
          "GUEST_SESSION_EXPIRED"
      ) {
        queryClient.removeQueries({
          queryKey:
            queryKeys.consultations.all,
        });

        void queryClient.invalidateQueries({
          queryKey:
            queryKeys.session.all,
        });
      }
    },
  });
}

type UpdateFollowUpAnswerVariables = {
  consultationId: string;
  questionId: string;
  answer: string;
};

export function useUpdateFollowUpAnswerMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
      questionId,
      answer,
    }: UpdateFollowUpAnswerVariables) =>
      updateFollowUpAnswer(
        consultationId,
        questionId,
        answer,
      ),

    onSuccess: async (
      data,
      variables,
    ) => {
      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations
            .followUpRoot(
              variables.consultationId,
            ),
      });

      queryClient.setQueryData(
        queryKeys.consultations.followUp(
          variables.consultationId,
          null,
        ),
        data,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },
  });
}

export function useConsultationSummaryQuery(
  consultationId:
    | string
    | null
    | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey:
      queryKeys.consultations.summary(
        consultationId ?? "pending",
      ),

    queryFn: () => {
      if (!consultationId) {
        throw new Error(
          "Consultation ID is required.",
        );
      }

      return getConsultationSummary(
        consultationId,
      );
    },

    enabled:
      Boolean(consultationId) &&
      enabled,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

type PrepareConsultationSummaryVariables =
  {
    consultationId: string;
  };

export function usePrepareConsultationSummaryMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: PrepareConsultationSummaryVariables) =>
      prepareConsultationSummary(
        consultationId,
      ),

    onSuccess: async (
      data,
      variables,
    ) => {
      queryClient.setQueryData(
        queryKeys.consultations.summary(
          variables.consultationId,
        ),
        data,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },
  });
}

// consultationId => 백엔드의 UUID가 프론트/JSON으로 넘어오면 문자열로 표현됨
type ConfirmConsultationSummaryVariables =
  {
    consultationId: string;
  };

export function useConfirmConsultationSummaryMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: ConfirmConsultationSummaryVariables) =>
      confirmConsultationSummary(
        consultationId,
      ),

    onSuccess: async (
      _data,
      variables,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.summary(
              variables.consultationId,
            ),
        }),
      ]);
    },
  });
}

export function useAnalysisStateQuery(
  consultationId:
    | string
    | null
    | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey:
      queryKeys.consultations.analysis(
        consultationId ?? "pending",
      ),

    queryFn: () => {
      if (!consultationId) {
        throw new Error(
          "Consultation ID is required.",
        );
      }

      return getConsultationAnalysis(
        consultationId,
      );
    },

    enabled:
      Boolean(consultationId) &&
      enabled,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,

    // Polling은 QUEUED, PROCESSING일 때만 2초마다 진행
    // 상태가 바뀔 가능성이 있을 때만 Polling 진행
    refetchInterval: (query) => {
      const status =
        query.state.data?.status;

      if (
        status === "QUEUED" ||
        status === "PROCESSING"
      ) {
        return 2_000;
      }

      return false;
    },

    refetchIntervalInBackground:
      false,
  });
}

type AnalysisMutationVariables = {
  consultationId: string;
};

export function useStartAnalysisMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: AnalysisMutationVariables) =>
      startConsultationAnalysis(
        consultationId,
      ),

    onSuccess: (
      data,
      variables,
    ) => {
      queryClient.setQueryData(
        queryKeys.consultations.analysis(
          variables.consultationId,
        ),
        data,
      );

      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.consultations.active(),
      });
    },
  });
}

export function useRetryAnalysisMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: AnalysisMutationVariables) =>
      retryConsultationAnalysis(
        consultationId,
      ),

    onSuccess: (
      data,
      variables,
    ) => {
      queryClient.setQueryData(
        queryKeys.consultations.analysis(
          variables.consultationId,
        ),
        data,
      );

      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.consultations.active(),
      });
    },
  });
}

export function useReopenAnalysisMutation() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      consultationId,
    }: AnalysisMutationVariables) =>
      reopenConsultationAnalysis(
        consultationId,
      ),

    onSuccess: async (
      _data,
      variables,
    ) => {
      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations
            .analysisRoot(
              variables.consultationId,
            ),
      });

      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations
            .summaryRoot(
              variables.consultationId,
            ),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.active(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            queryKeys.consultations.detail(
              variables.consultationId,
            ),
        }),
      ]);
    },
  });
}