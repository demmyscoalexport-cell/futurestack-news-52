import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import DealsAdminClient from "./deals-admin-client";

export default async function DealsAdminPage() {
  await checkAdminOrRedirect();
  return <DealsAdminClient />;
}
