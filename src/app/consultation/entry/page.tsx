import ConsultationEntry from "@/components/consultation/ConsultationEntry";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ConsultationEntryPage() {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6 sm:px-8">
        <ConsultationEntry />
      </main>
    </div>
  );
}
