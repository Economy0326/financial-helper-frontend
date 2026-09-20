"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import EmergencyProgress from "@/components/emergency/EmergencyProgress";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import type {
  EmergencyScenarioActionItem,
} from "@/lib/api/types";

import {
  useEmergencyScenarioQuery,
} from "@/lib/query/emergency";

function ActionCard({
  title,
  tone,
  items,
  icon,
}: {
  title: string;
  tone: "primary" | "danger";
  items: EmergencyScenarioActionItem[];
  icon: ReactNode;
}) {
  const isDanger = tone === "danger";

  return (
    <section
      className={[
        "rounded-card border px-5 py-6 sm:px-6 sm:py-7",
        isDanger
          ? "border-danger/30 bg-danger-surface"
          : "border-primary/30 bg-primary-subtle",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center",
            "rounded-full text-xl font-bold",
            isDanger
              ? "bg-surface-subtle text-danger"
              : "bg-primary-subtle text-primary",
          ].join(" ")}
        >
          {icon}
        </span>

        <h2
          className={[
            "text-xl font-bold sm:text-2xl",
            isDanger
              ? "text-danger"
              : "text-primary",
          ].join(" ")}
        >
          {title}
        </h2>
      </div>

      <ol className="mt-6 space-y-0">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={[
              "flex gap-4 py-5",
              "border-b border-border last:border-b-0",
              "first:pt-0 last:pb-0",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center",
                "rounded-full font-bold",
                isDanger
                  ? "border-2 border-danger text-danger"
                  : "bg-primary text-primary-foreground",
              ].join(" ")}
            >
              {isDanger ? "×" : index + 1}
            </span>

            <div className="min-w-0">
              <h3 className="break-keep font-bold leading-7 text-foreground sm:text-lg">
                {item.title}
              </h3>

              <p className="mt-1 break-keep leading-7 text-foreground-muted">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function EmergencyImmediateAction() {
  const router = useRouter();

  const actionQuery =
    useEmergencyScenarioQuery();

  if (actionQuery.isLoading) {
    return (
      <>
        <EmergencyProgress
          currentStep={2}
          label="즉시 대응"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            필요한 긴급 대응을 확인하고 있어요.
          </p>

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

  if (actionQuery.isError) {
    return (
      <>
        <EmergencyProgress
          currentStep={2}
          label="즉시 대응"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            긴급 대응 정보를 불러오지 못했어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            안전한 안내를 불러오지 못했어요.
            잠시 후 다시 확인해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                actionQuery.refetch()
              }
            >
              다시 시도
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push("/emergency/type")
              }
            >
              피해 유형 다시 선택
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state = actionQuery.data;

  if (!state) {
    return null;
  }

  if (state.kind === "not-selected") {
    return (
      <>
        <EmergencyProgress
          currentStep={2}
          label="즉시 대응"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            먼저 피해 유형을 선택해 주세요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            현재 상황에 맞는 긴급 대응을 확인하려면
            피해 유형 선택이 필요해요.
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.replace(
                  "/emergency/type",
                )
              }
            >
              피해 유형 선택하기
            </PrimaryButton>
          </div>
        </div>
      </>
    );
  }

  const data = state.scenario;

  return (
    <>
      <EmergencyProgress
        currentStep={2}
        label="즉시 대응"
      />

      <header className="mx-auto mt-9 max-w-2xl text-center sm:mt-12">
        <h1 className="break-keep text-[2rem] font-bold leading-[1.28] tracking-[-0.025em] text-foreground sm:text-4xl">
          {data.title}
        </h1>

        <p className="mt-4 break-keep leading-7 text-foreground-muted sm:text-lg">
          {data.description}
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <ActionCard
          title="지금 해야 할 행동"
          tone="primary"
          icon="✓"
          items={data.actionsToDo}
        />

        <ActionCard
          title="이 행동은 하지 마세요"
          tone="danger"
          icon="!"
          items={data.actionsToAvoid}
        />
      </div>

      <p className="mt-7 text-center text-base font-medium leading-7 text-foreground-muted">
        다음으로 연락할 곳과 남겨둘 증거를 확인해요.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <SecondaryButton
          type="button"
          className="w-full sm:order-1"
          onClick={() =>
            router.push("/emergency/type")
          }
        >
          이전으로
        </SecondaryButton>

        <PrimaryButton
          type="button"
          className="w-full sm:order-2"
          onClick={() =>
            router.push(
              "/emergency/contact-evidence",
            )
          }
        >
          연락할 곳 확인하기
        </PrimaryButton>
      </div>
    </>
  );
}
