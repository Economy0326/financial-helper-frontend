import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/lib/api/session";

import { queryKeys } from "./keys";

export function useSessionQuery() {
  return useQuery({
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

}
