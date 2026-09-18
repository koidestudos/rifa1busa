import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

export function SiteShell({
  children,
  profile = null,
  tone = "page",
  showFooter = true,
}: {
  children: React.ReactNode;
  profile?: Profile | null;
  tone?: "page" | "home";
  showFooter?: boolean;
}) {
  return (
    <div className={cn("flex min-h-screen flex-col", tone === "home" ? "bg-white" : "bg-page")}>
      <Navbar profile={profile} />
      <div className="flex-1">{children}</div>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
