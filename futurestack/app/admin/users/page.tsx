import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import UsersClient from "./users-client";

export default async function AdminUsersPage() {
  await checkAdminOrRedirect();
  return <UsersClient />;
}
