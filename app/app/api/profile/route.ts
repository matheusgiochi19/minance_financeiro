import { NextResponse } from "next/server";
import { getCurrentProfile, resolveAvatarUrl } from "@/lib/profiles";

export async function GET() {
  const { profile, user } = await getCurrentProfile();

  if (!user) {
    return NextResponse.json({ avatarUrl: null, fullName: null }, { status: 401 });
  }

  return NextResponse.json(
    {
      avatarUrl: await resolveAvatarUrl(profile?.avatar_url),
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email || null
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
