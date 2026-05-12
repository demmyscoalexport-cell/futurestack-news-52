import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ToolsQueueClient from "./tools-queue-client";

export default async function ToolsQueuePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return <ToolsQueueClient />;
}
