import type { Metadata } from "next";
import { PrayerView } from "@/views/PrayerView";

export const metadata: Metadata = { title: "Prayer times and Qibla" };

export default function Page() {
  return <PrayerView />;
}
