import type { Metadata } from "next";
import { LearnView } from "@/views/LearnView";

export const metadata: Metadata = { title: "Learn" };

export default function Page() {
  return <LearnView />;
}
