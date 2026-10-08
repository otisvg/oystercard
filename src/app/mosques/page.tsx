import type { Metadata } from "next";
import { MosquesView } from "@/views/MosquesView";

export const metadata: Metadata = { title: "Mosques near you" };

export default function Page() {
  return <MosquesView />;
}
