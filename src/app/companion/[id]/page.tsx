import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingPage } from "@/components/ui";
import { MeetupView } from "@/views/MeetupView";

export const metadata: Metadata = { title: "Meet-up" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <MeetupView />
    </Suspense>
  );
}
