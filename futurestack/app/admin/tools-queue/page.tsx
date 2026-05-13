import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import ToolsQueueClient from "./tools-queue-client";

export default async function ToolsQueuePage() {
  await checkAdminOrRedirect();
  return <ToolsQueueClient />;
}
