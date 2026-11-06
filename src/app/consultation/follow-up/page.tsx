import FollowUpFlow from "@/components/consultation/FollowUpFlow";
import Link from "next/link";
import InformationIntakeEditLink from "@/components/consultation/InformationIntakeEditLink";

export default function FollowUpPage() {
  return (
    <main className="min-h-screen bg-background px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <FollowUpFlow />
        <InformationIntakeEditLink />
        <Link href="/consultation/information" className="mt-8 inline-flex min-h-12 items-center rounded-control border border-border bg-surface px-4 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">공식 정보 확인하기</Link>
      </div>
    </main>
  );
}
