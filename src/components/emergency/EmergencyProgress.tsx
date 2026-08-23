type EmergencyProgressProps = {
  currentStep: number;
  totalSteps?: number;
  label: string;
};

export default function EmergencyProgress({
  currentStep,
  totalSteps = 4,
  label,
}: EmergencyProgressProps) {
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
        aria-label={`긴급 대응 진행 단계: ${totalSteps}단계 중 ${currentStep}단계`}
        className="mx-auto mt-5 flex w-full max-w-md items-center"
      >
        {steps.map((step) => {
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <li
              key={step}
              aria-current={
                isCurrent ? "step" : undefined
              }
              className="flex flex-1 items-center last:flex-none"
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center",
                  "rounded-full text-sm font-bold",
                  isComplete || isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-border text-foreground-muted",
                ].join(" ")}
              >
                {isComplete ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  <span className="sr-only">
                    {step}단계
                  </span>
                )}
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