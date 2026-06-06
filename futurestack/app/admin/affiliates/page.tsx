export const dynamic = "force-dynamic";
import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import AffiliatesClient from "./affiliates-client";

export default async function AffiliatesAdminPage() {
  await checkAdminOrRedirect();
  return <AffiliatesClient />;
}
