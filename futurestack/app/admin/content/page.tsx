import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import ContentClient from "./content-client";

export default async function AdminContentPage() {
  await checkAdminOrRedirect();
  return <ContentClient />;
}
