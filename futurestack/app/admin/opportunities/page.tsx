import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import OpportunitiesAdminClient from "./opportunities-admin-client";

export default async function OpportunitiesAdminPage() {
  await checkAdminOrRedirect();
  return <OpportunitiesAdminClient />;
}
