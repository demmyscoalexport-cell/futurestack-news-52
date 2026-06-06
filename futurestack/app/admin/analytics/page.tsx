export const dynamic = "force-dynamic";
import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import AnalyticsClient from "./analytics-client";

export default async function AdminAnalyticsPage() {
  await checkAdminOrRedirect();
  return <AnalyticsClient />;
}
