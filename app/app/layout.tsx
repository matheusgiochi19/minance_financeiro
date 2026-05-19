import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { OnboardingPanel } from "@/components/onboarding-panel";
import { ThemeApplier } from "@/components/theme-applier";
import { UrlAlertBanner } from "@/components/url-alert-banner";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/profiles";
import { normalizeThemePreference } from "@/lib/theme";

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

  const theme = normalizeThemePreference(profile?.theme_preference);

  return (
    <AppShell fullName={profile?.full_name || user.user_metadata?.full_name || user.email} role={profile?.role || "user"} theme={theme}>
      <ThemeApplier theme={theme} />
      <UrlAlertBanner />
      {profile?.onboarding_hidden ? null : <OnboardingPanel />}
      {children}
    </AppShell>
  );
}
