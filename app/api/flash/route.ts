import { NextResponse } from "next/server";
import { clearFlashMessage } from "@/lib/flash";

export async function DELETE() {
  await clearFlashMessage();
  return NextResponse.json({ ok: true });
}
