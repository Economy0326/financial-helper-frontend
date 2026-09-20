import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/lib/api/session";

import { queryKeys } from "./keys";

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session.all,
    queryFn: getSession,
    // Session은 공통 인증 bootstrap이다. observer가 마운트될 때마다
    // 인증/소유권 응답이 자동 재시도로 확산되면 안 된다.
    // 일시적인 네트워크 실패에는 해당 화면의 명시적 재시도 동작을 사용한다.
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });

}
