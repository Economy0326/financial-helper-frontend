type StepProgressProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
  ariaLabel: string;
};

export default function StepProgress({
  currentStep,
  totalSteps,
  label,
  ariaLabel,
}: StepProgressProps) {
  const steps = Array.from(
    { length: totalSteps },
    (_, index) => index + 1,
  );

  return (
    <div>
      <p className="text-center text-base text-foreground sm:text-lg">
        <strong className="text-primary">
          {currentStep}/{totalSteps}
        </strong>{" "}
        {label}
      </p>

      <ol
        aria-label={`${ariaLabel}: ${totalSteps}단계 중 ${currentStep}단계`}
        className="mx-auto mt-5 flex w-full max-w-lg items-center"
      >
        {steps.map((step) => {
          const isComplete =
            step < currentStep;

          const isCurrent =
            step === currentStep;

          return (
            <li
              key={step}
              aria-current={
                isCurrent
                  ? "step"
                  : undefined
              }
              className="flex flex-1 items-center last:flex-none"
            >
              <span
                aria-hidden="true"
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center",
                  "rounded-full border text-sm font-bold",
                  isComplete || isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-subtle text-foreground-muted",
                ].join(" ")}
              >
                {isComplete
                  ? "✓"
                  : null}
              </span>

              <span className="sr-only">
                {isComplete
                  ? `${step}단계 완료`
                  : isCurrent
                    ? `${step}단계 현재 단계`
                    : `${step}단계 예정`}
              </span>

              {step < totalSteps ? (
                <span
                  aria-hidden="true"
                  className={[
                    "h-1 flex-1",
                    step < currentStep
                      ? "bg-primary"
                      : "bg-border",
                  ].join(" ")}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}