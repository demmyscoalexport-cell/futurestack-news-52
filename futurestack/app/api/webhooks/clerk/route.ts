import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { syncClerkProfile } from "@/lib/clerk/sync-profile";
import { config } from "@/lib/config";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!config.clerk.isConfigured || !config.clerk.webhookSecret) {
    return NextResponse.json(
      { success: false, error: "Clerk webhook not configured" },
      { status: 503 },
    );
  }

  try {
    const evt = await verifyWebhook(req, {
      signingSecret: config.clerk.webhookSecret,
    });

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;
      const email =
        user.email_addresses?.find(
          (item) => item.id === user.primary_email_address_id,
        )?.email_address ??
        user.email_addresses?.[0]?.email_address ??
        "";

      const result = await syncClerkProfile({
        clerkUserId: user.id,
        email,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
        avatarUrl: user.image_url ?? null,
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 400 },
    );
  }
}
