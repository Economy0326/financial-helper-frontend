"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getInformationIntake } from "@/lib/api/consultation";
import { useActiveConsultationQuery } from "@/lib/query/consultation";
import { useSessionQuery } from "@/lib/query/session";

export default function InformationIntakeEditLink() {
  const session = useSessionQuery();
  const active = useActiveConsultationQuery(session.data?.authenticated === true);
  const id = active.data?.consultationId;
  const intake = useQuery({ queryKey: ["information-intake", id], queryFn: () => getInformationIntake(id!), enabled: !!id, retry: false });
  if (!intake.isSuccess) return null;
  return <Link href="/consultation/intake" className="mt-4 inline-flex min-h-12 items-center px-4 font-semibold text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">처음 입력한 상황 수정하기</Link>;
}
