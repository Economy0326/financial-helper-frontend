import InformationReport from "@/components/consultation/InformationReport";
import { Suspense } from "react";

export default function InformationPage() {
  return <main className="min-h-screen bg-background px-4 pb-12 pt-6 sm:px-6 sm:pt-8"><div className="mx-auto w-full max-w-3xl"><Suspense fallback={<p role="status">정보를 확인하고 있어요.</p>}><InformationReport /></Suspense></div></main>;
}
