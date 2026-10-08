import { Suspense } from "react";
import { LoadingPage } from "@/components/ui";
import { MosqueDetailView } from "@/views/MosquesView";

export default function Page() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <MosqueDetailView />
    </Suspense>
  );
}
