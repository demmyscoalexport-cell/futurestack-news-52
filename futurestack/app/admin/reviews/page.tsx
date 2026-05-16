import { checkAdminOrRedirect } from "@/lib/supabase/admin-guard";
import ReviewsClient from "./reviews-client";

export default async function AdminReviewsPage() {
  await checkAdminOrRedirect();
  return <ReviewsClient />;
}
