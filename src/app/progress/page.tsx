import type { Metadata } from "next";
import { ProgressView } from "@/views/ProgressView";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return <ProgressView />;
}
