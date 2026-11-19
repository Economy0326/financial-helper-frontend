import { redirect } from "next/navigation";

export default function LegacyReviewerRedirect() {
  redirect("/official-source-review/documents");
}
