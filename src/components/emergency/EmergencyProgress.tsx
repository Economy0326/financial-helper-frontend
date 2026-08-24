import StepProgress from "@/components/ui/StepProgress";

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
  return (
    <StepProgress
      currentStep={currentStep}
      totalSteps={totalSteps}
      label={label}
      ariaLabel="긴급 대응 진행 단계"
    />
  );
}