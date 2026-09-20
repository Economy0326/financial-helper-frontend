import type { Metadata } from "next";
import type { ReactNode } from "react";

import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "금융도우미",
    template: "%s | 금융도우미",
  },
  description:
    "금융 피해 상황을 단계적으로 정리하고 다음 행동을 확인하는 금융소비자 보호 서비스",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
