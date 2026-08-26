import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getActiveConsultation,
  startConsultation,
  updateConsultationCategory,
  updateConsultationSituation,
} from "@/lib/api/consultation";

import type {
  ConsultationCategory,
} from "@/lib/api/types";

import { queryKeys } from "./keys";

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
  });
}

// 첫 상담 생성
export function useStartConsultationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startConsultation,

    onSuccess: async () => {
      // Promise로 session과 active 모두 invalidate
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

    onSuccess: async () => {
      await Promise.all([
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

    onSuccess: async () => {
      await Promise.all([
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