"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  // 해당 provider가 살아 있는 동안 같은 Query Client를 유지
  // 기본 Tanstack Query 캐시는 메모리에 존재 -> 새로고침시 새로운 Query Client 객체 생성
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}