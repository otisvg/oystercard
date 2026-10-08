import type { Metadata } from "next";
import { ProfileView } from "@/views/ProfileView";

export const metadata: Metadata = { title: "Profile and safety" };

export default function Page() {
  return <ProfileView />;
}
