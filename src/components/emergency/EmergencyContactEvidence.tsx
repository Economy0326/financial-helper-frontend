"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import EmergencyProgress from "@/components/emergency/EmergencyProgress";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

import type {
  EmergencyScenarioContact,
} from "@/lib/api/types";

import {
  useEmergencyScenarioQuery,
} from "@/lib/query/emergency";

function ContactIcon({
  type,
}: {
  type: EmergencyScenarioContact["icon"];
}) {
  if (type === "police") {
    return (
      <span
        aria-hidden="true"
        className="text-2xl"
      >
        🛡
      </span>
    );
  }

  if (type === "card-company") {
    return (
      <span
        aria-hidden="true"
        className="text-2xl"
      >
        ▣
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="text-2xl"
    >
      ◉
    </span>
  );
}

function ContactRow({
  contact,
}: {
  contact: EmergencyScenarioContact;
}) {
  return (
    <li
      className={[
        "flex flex-col gap-4 border-b border-border py-5",
        "first:pt-0 last:border-b-0 last:pb-0",
        "sm:flex-row sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center",
            "rounded-full bg-primary-subtle text-primary",
          ].join(" ")}
        >
          <ContactIcon type={contact.icon} />
        </span>

        <div>
          <p className="font-bold text-foreground sm:text-lg">
            {contact.name}
          </p>

          <p className="mt-1 leading-6 text-foreground-muted">
            {contact.description}
          </p>

          {contact.phoneLabel ? (
            <p className="mt-1 text-sm font-semibold text-primary">
              {contact.phoneLabel}
            </p>
          ) : null}
        </div>
      </div>

      {contact.phoneHref ? (
        <a
          href={contact.phoneHref}
          className={[
            "inline-flex min-h-12 shrink-0 items-center justify-center",
            "rounded-control border border-primary px-5",
            "font-semibold text-primary",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-focus focus-visible:ring-offset-2",
          ].join(" ")}
          aria-label={`${contact.name}에 전화하기`}
        >
          <span aria-hidden="true">
            ☎
          </span>

          <span className="ml-2">
            전화하기
          </span>
        </a>
      ) : (
        <p className="shrink-0 text-sm font-medium text-foreground-muted">
          공식 고객센터를 확인해 주세요.
        </p>
      )}
    </li>
  );
}

export default function EmergencyContactEvidence() {
  const router = useRouter();

  // 사용자가 현재 확인한 증거 상태
  // 체크 여부는 서버에 저장하지 않음
  const [checkedEvidenceIds, setCheckedEvidenceIds] =
    useState<Set<string>>(() => new Set());

  const contactEvidenceQuery =
    useEmergencyScenarioQuery();

  function toggleEvidence(
    evidenceId: string,
  ) {
    setCheckedEvidenceIds((current) => {
      const next = new Set(current);

      if (next.has(evidenceId)) {
        next.delete(evidenceId);
      } else {
        next.add(evidenceId);
      }

      return next;
    });
  }

  if (contactEvidenceQuery.isLoading) {
    return (
      <>
        <EmergencyProgress
          currentStep={3}
          label="연락 / 증거 보존"
        />

        <div
          className="py-20 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-lg font-semibold text-foreground">
            연락처와 증거 보존 방법을 확인하고
            있어요.
          </p>

          <p className="mt-2 text-foreground-muted">
            잠시만 기다려 주세요.
          </p>
        </div>
      </>
    );
  }

  if (contactEvidenceQuery.isError) {
    return (
      <>
        <EmergencyProgress
          currentStep={3}
          label="연락 / 증거 보존"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            연락처와 증거 정보를 불러오지
            못했어요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            잠시 후 다시 확인해 주세요.
          </p>

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() =>
                contactEvidenceQuery.refetch()
              }
            >
              다시 시도
            </PrimaryButton>

            <SecondaryButton
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  "/emergency/action",
                )
              }
            >
              이전으로
            </SecondaryButton>
          </div>
        </div>
      </>
    );
  }

  const state = contactEvidenceQuery.data;

  if (!state) {
    return null;
  }

  if (state.kind === "not-selected") {
    return (
      <>
        <EmergencyProgress
          currentStep={3}
          label="연락 / 증거 보존"
        />

        <div className="py-16 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            먼저 피해 유형을 선택해 주세요.
          </h1>

          <p className="mt-4 leading-7 text-foreground-muted">
            현재 상황에 맞는 연락처와 증거
            보존 방법을 확인해야 해요.
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
        currentStep={3}
        label="연락 / 증거 보존"
      />

      <header className="mt-10 text-center sm:mt-12">
        <div
          aria-hidden="true"
          className="text-4xl"
        >
          🚨
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          연락하고, 증거를 남겨두세요
        </h1>

        <p className="mt-4 leading-7 text-foreground-muted sm:text-lg">
          필요한 곳에 연락하고,
          <br className="sm:hidden" />
          관련 기록은 삭제하지 말고 보관해 주세요.
        </p>
      </header>

      <section
        aria-labelledby="emergency-contacts-heading"
        className="mt-8 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
      >
        <h2
          id="emergency-contacts-heading"
          className="text-xl font-bold text-foreground sm:text-2xl"
        >
          연락할 곳
        </h2>

        <ul className="mt-6">
          {data.contacts.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
            />
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="emergency-evidence-heading"
        className="mt-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6"
      >
        <h2
          id="emergency-evidence-heading"
          className="text-xl font-bold text-foreground sm:text-2xl"
        >
          증거를 지우지 마세요
        </h2>

        <p className="mt-2 leading-7 text-foreground-muted">
          현재 가지고 있는 자료를 확인해
          보세요. 체크 여부는 서버에 저장되지
          않습니다.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">
            현재 보존하고 있는 증거 확인
          </legend>

          <div className="divide-y divide-border rounded-control border border-border">
            {data.evidence.map(
              (evidence) => {
                const isChecked =
                  checkedEvidenceIds.has(
                    evidence.id,
                  );

                const inputId =
                  `evidence-${evidence.id}`;

                return (
                  <div
                    key={evidence.id}
                    className="flex min-h-14 items-center px-4 py-3"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        toggleEvidence(
                          evidence.id,
                        )
                      }
                      className={[
                        "h-6 w-6 shrink-0 rounded",
                        "border-border-strong",
                        "accent-primary",
                        "focus-visible:outline-none",
                        "focus-visible:ring-2",
                        "focus-visible:ring-focus",
                        "focus-visible:ring-offset-2",
                      ].join(" ")}
                    />

                    <label
                      htmlFor={inputId}
                      className="ml-3 flex min-h-10 cursor-pointer items-center leading-6 text-foreground"
                    >
                      {evidence.label}
                    </label>
                  </div>
                );
              },
            )}
          </div>
        </fieldset>

        <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-foreground-muted">
          <span
            aria-hidden="true"
            className="font-bold text-primary"
          >
            i
          </span>

          <span>
            삭제하거나 수정하지 말고 가능한
            그대로 보관해 주세요.
          </span>
        </p>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <SecondaryButton
          type="button"
          className="w-full"
          onClick={() =>
            router.push(
              "/emergency/action",
            )
          }
        >
          이전으로
        </SecondaryButton>

        <PrimaryButton
          type="button"
          className="w-full"
          onClick={() =>
            router.push(
              "/emergency/next-help",
            )
          }
        >
          다음 단계
        </PrimaryButton>
      </div>
    </>
  );
}