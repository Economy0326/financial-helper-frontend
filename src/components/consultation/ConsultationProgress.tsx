import StepProgress from "@/components/ui/StepProgress";

type ConsultationProgressProps = {
  currentStep: number;
  totalSteps?: number;
  label: string;
};

export default function ConsultationProgress({
  currentStep,
  totalSteps = 6,
  label,
}: ConsultationProgressProps) {
  return (
    <StepProgress
      currentStep={currentStep}
      totalSteps={totalSteps}
      label={label}
      ariaLabel="상담 진행 단계"
    />
  );
}