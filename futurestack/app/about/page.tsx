import { MarketingInfoPage } from "@/components/static/marketing-info-page";

export const metadata = {
  title: "About DISCOVA | Software Discovery for Africa and the World",
  description: "Learn how DISCOVA helps people discover, research, compare, and learn software without leaving the platform.",
};

export default function AboutPage() {
  return (
    <MarketingInfoPage
      eyebrow="About"
      title="DISCOVA is a software discovery operating system."
      description="DISCOVA helps users discover, research, compare, save, and learn software through rich tool pages, tutorials, comparisons, collections, and verified product intelligence."
      points={[
        "Built for creators, founders, students, agencies, and teams that need practical software guidance.",
        "Designed around premium tool cards and full product intelligence pages instead of shallow directory listings.",
        "Focused on trust signals, verified sources, tutorials, alternatives, and real workflow context.",
        "Made for African realities while remaining useful to global software buyers.",
      ]}
    />
  );
}
