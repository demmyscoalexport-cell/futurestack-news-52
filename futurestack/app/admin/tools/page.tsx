export const dynamic = "force-dynamic";
import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import ToolsClient from "./tools-client";

export default async function AdminToolsPage() {
  await checkAdminOrRedirect();
  return <ToolsClient />;
}
