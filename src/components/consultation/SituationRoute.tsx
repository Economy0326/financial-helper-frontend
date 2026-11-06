"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getInformationIntake } from "@/lib/api/consultation";
import { ApiResponseError } from "@/lib/api/errors";
import { useActiveConsultationQuery } from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";
import SituationInputForm from "./SituationInputForm";

export default function SituationRoute() {
  const router = useRouter();
  const session = useSessionQuery();
  const active = useActiveConsultationQuery(session.data?.hasActiveConsultation === true);
  const id = active.data?.consultationId;
  const intake = useQuery({ queryKey: ["information-intake", id], queryFn: () => getInformationIntake(id!), enabled: !!id, retry: false, refetchOnMount: "always" });
  useEffect(() => { if (intake.isSuccess && !intake.isFetching) router.replace("/consultation/intake"); }, [intake.isSuccess, intake.isFetching, router]);
  if (session.isLoading || active.isLoading || (!!id && (intake.isLoading || intake.isFetching || intake.isSuccess))) return <p role="status">상담 입력 경로를 확인하고 있어요.</p>;
  if (session.isError || active.isError || (intake.isError && !(intake.error instanceof ApiResponseError && intake.error.status === 409))) return <p role="alert">상담 입력 경로를 확인하지 못했어요. 다시 시도해 주세요.</p>;
  return <SituationInputForm />;
}
