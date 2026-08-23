type ConsultationProgressProps = {
  currentStep: number;
  totalSteps: number;
  label: string;
};

// 상담 도메인 진행 상태 표현
export default function ConsultationProgress({
  currentStep,
  totalSteps,
  label,
}: ConsultationProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <div>
      <p className="text-center text-base text-foreground sm:text-lg">
        <strong className="text-primary">
          {currentStep}/{totalSteps}
        </strong>{" "}
        {label}
      </p>

      <ol
        aria-label={`상담 진행 단계: ${totalSteps}단계 중 ${currentStep}단계`}
        className="mx-auto mt-5 flex w-full max-w-lg items-center"
      >
        {steps.map((step) => {
          const isComplete = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <li
              key={step}
              className="flex flex-1 items-center last:flex-none"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                  isComplete || isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-strong bg-surface-subtle text-foreground-muted",
                ].join(" ")}
              >
                {isComplete ? (
                  <span aria-hidden="true">✓</span>
                ) : (
                  <span className="sr-only">{step}단계</span>
                )}
              </span>

              {step < totalSteps ? (
                <span
                  aria-hidden="true"
                  className={[
                    "h-1 flex-1",
                    step < currentStep ? "bg-primary" : "bg-border",
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