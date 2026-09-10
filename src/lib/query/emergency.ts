import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getEmergencyScenario,
  getEmergencyTypes,
  selectEmergencyType,
} from "@/lib/api/emergency";
import type { EmergencyType } from "@/lib/api/types";

import { queryKeys } from "./keys";
import {
  queryRetryDelay,
  shouldRetryQuery,
} from "./retry";

export function useEmergencyTypesQuery() {
  return useQuery({
    queryKey: queryKeys.emergency.types(),
    queryFn: getEmergencyTypes,
    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

export function useEmergencyScenarioQuery() {
  return useQuery({
    queryKey: queryKeys.emergency.scenario(),
    queryFn: getEmergencyScenario,

    // 긴급 대응은 진입할 때 서버 상태를 다시 확인한다.
    staleTime: 0,
    gcTime: 0,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });
}

export function useSelectEmergencyTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: EmergencyType) =>
      selectEmergencyType(type),

    onSuccess: async () => {
      // 피해 유형이 변경되면 이전 Scenario는 더 이상 유효하지 않음
      queryClient.removeQueries({
        queryKey: queryKeys.emergency.scenario(),
      });

      // 만료된 GuestSession이 새 Session으로 교체됐을 수도 있으므로
      // 이전 Guest 기준 Consultation cache도 제거
      queryClient.removeQueries({
        queryKey: queryKeys.consultations.all,
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.session.all,
      });
    },
  });
}