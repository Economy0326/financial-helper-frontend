import ConsultationEntry from "@/components/consultation/ConsultationEntry";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ConsultationEntryPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6 sm:px-6">
        <ConsultationEntry />
      </main>
    </div>
  );
}
