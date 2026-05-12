import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OnboardingPanel } from "@/components/onboarding-panel";
import { createClient } from "@/lib/supabase/server";
import { getAvatarDisplayUrl, getCurrentProfile } from "@/lib/profiles";

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  if (profile?.ativo === false) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <AppShell avatarUrl={getAvatarDisplayUrl(profile)} fullName={profile?.full_name || user.user_metadata?.full_name || user.email} role={profile?.role || "user"}>
      {profile?.onboarding_hidden ? null : <OnboardingPanel />}
      {children}
    </AppShell>
  );
}
