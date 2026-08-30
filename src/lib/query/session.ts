import { useEffect } from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getSession } from "@/lib/api/session";

import { queryKeys } from "./keys";
import {
  queryRetryDelay,
  shouldRetryQuery,
} from "./retry";

export function useSessionQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.session.all,
    queryFn: getSession,

    retry: shouldRetryQuery,
    retryDelay: queryRetryDelay,
  });

  const hasActiveConsultation =
    query.data?.hasActiveConsultation;

  useEffect(() => {
    if (
      query.isSuccess &&
      hasActiveConsultation === false
    ) {
      queryClient.removeQueries({
        queryKey:
          queryKeys.consultations.all,
      });
    }
  }, [
    query.isSuccess,
    hasActiveConsultation,
    queryClient,
  ]);

  return query;
}