import type {
  ConsultationStep,
} from "@/lib/api/types";

export type ConsultationPageAccess =
  | {
      status: "allowed";
    }
  | {
      status: "no-consultation";
    }
  | {
      status: "wrong-step";
      currentStep: ConsultationStep;
    };

const categoryEditableSteps =
  new Set<ConsultationStep>([
    "CATEGORY",
    "SITUATION",
  ]);

const situationEditableSteps =
  new Set<ConsultationStep>([
    "SITUATION",
    "FOLLOW_UP",
  ]);

export function getCategoryPageAccess(
  currentStep: ConsultationStep | null,
): ConsultationPageAccess {
  if (!currentStep) {
    return {
      status: "no-consultation",
    };
  }

  if (
    categoryEditableSteps.has(currentStep)
  ) {
    return {
      status: "allowed",
    };
  }

  return {
    status: "wrong-step",
    currentStep,
  };
}

export function getSituationPageAccess(
  currentStep: ConsultationStep | null,
): ConsultationPageAccess {
  if (!currentStep) {
    return {
      status: "no-consultation",
    };
  }

  if (
    situationEditableSteps.has(currentStep)
  ) {
    return {
      status: "allowed",
    };
  }

  return {
    status: "wrong-step",
    currentStep,
  };
}