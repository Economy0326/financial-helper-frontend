import { useEffect } from "react";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getSession } from "@/lib/api/session";

import { queryKeys } from "./keys";

export function useSessionQuery() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.session.all,
    queryFn: getSession,
    // Session is the shared auth bootstrap. An auth/ownership response must
    // not fan out into automatic retries as each mounted observer appears.
    // The explicit retry action in the owning screen remains available for
    // transient network failures.
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
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
