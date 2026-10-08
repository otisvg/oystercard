import type { Metadata } from "next";
import { WelcomeView } from "@/views/WelcomeView";

export const metadata: Metadata = { title: "Welcome" };

export default function Page() {
  return <WelcomeView />;
}
