import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";
import { GuideView } from "@/views/LearnView";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getGuide(slug)?.title ?? "Guide" };
}

export default async function Page({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideView guide={guide} />;
}
