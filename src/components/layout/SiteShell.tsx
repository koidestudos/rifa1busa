import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Profile } from "@/lib/types";

export function SiteShell({
  children,
  profile = null,
}: {
  children: React.ReactNode;
  profile?: Profile | null;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar profile={profile} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
