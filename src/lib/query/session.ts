import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/lib/api/session";

import { queryKeys } from "./keys";

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session.all,
    queryFn: getSession,
  });
}