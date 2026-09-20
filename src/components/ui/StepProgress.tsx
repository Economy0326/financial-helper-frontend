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
      <p className="text-center text-base font-bold text-foreground">
        <span className="text-primary">{label}</span>
        <span className="ml-2 font-semibold text-foreground-muted">
          {currentStep}/{totalSteps}
        </span>
      </p>

      <ol
        aria-label={`${ariaLabel}: ${totalSteps}단계 중 ${currentStep}단계`}
        className="mx-auto mt-4 flex w-full max-w-sm items-center gap-2"
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
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  isComplete || isCurrent
                    ? "bg-primary"
                    : "bg-border",
                ].join(" ")}
              >
                {null}
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
                    "h-0.5 flex-1",
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
