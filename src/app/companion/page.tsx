import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui";
import { CompanionView } from "@/views/CompanionView";

export const metadata: Metadata = { title: "Companion" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <CompanionView />
    </Suspense>
  );
}
