"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function hideOnboarding() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("profiles").update({ onboarding_hidden: true }).eq("user_id", user.id);
  revalidatePath("/app/dashboard");
}
