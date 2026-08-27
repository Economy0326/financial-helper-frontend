import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getActiveConsultation,
  getConsultation,
  startConsultation,
  updateConsultationCategory,
  updateConsultationSituation,
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