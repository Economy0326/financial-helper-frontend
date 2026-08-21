import { AppHeader } from "@/components/layout/AppHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";

export default function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[44rem]">
          <p className="text-sm font-semibold text-primary">
            Roadmap 7
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            공통 UI 기반 확인
          </h1>

          <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
            실제 화면 구현 전에 Header, Button, Surface
            Card가 동일한 Design Token을 사용하는지
            확인합니다.
          </p>

          <SurfaceCard className="mt-8">
            <h2 className="text-xl font-bold">
              금융 문제 해결을 시작해볼까요?
            </h2>

            <p className="mt-3 leading-7 text-foreground-muted">
              실제 Home 화면은 다음 단계에서 Responsive
              Design Reference를 기준으로 구현합니다.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton className="w-full sm:w-auto">
                시작하기
              </PrimaryButton>

              <SecondaryButton className="w-full sm:w-auto">
                나중에 하기
              </SecondaryButton>
            </div>
          </SurfaceCard>
        </div>
      </main>
    </>
  );
}