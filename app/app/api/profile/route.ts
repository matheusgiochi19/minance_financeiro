import { NextResponse } from "next/server";
import { getAvatarDisplayUrl, getCurrentProfile } from "@/lib/profiles";

export async function GET() {
  const { profile, user } = await getCurrentProfile();

  if (!user) {
    return NextResponse.json({ avatarUrl: null, fullName: null }, { status: 401 });
  }

  return NextResponse.json(
    {
      avatarUrl: getAvatarDisplayUrl(profile),
      fullName: profile?.full_name || user.user_metadata?.full_name || user.email || null
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
