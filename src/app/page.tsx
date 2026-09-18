import { getCurrentProfile } from "@/lib/auth";
import { getRaffleStats } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SiteShell } from "@/components/layout/SiteShell";
import { HomePage } from "@/components/home/HomePage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [profile, stats] = await Promise.all([
    getCurrentProfile(),
    getRaffleStats(),
  ]);

  return (
    <SiteShell profile={profile}>
      <HomePage stats={stats} configured={isSupabaseConfigured()} />
    </SiteShell>
  );
}
