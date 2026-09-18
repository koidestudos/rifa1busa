import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";
import { PatrioticScene } from "@/components/brand/Decor";
import { AdminBottomNav, StudentBottomNav } from "@/components/layout/BottomNav";
import { isStaff } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (profile.must_change_password) {
    return (
      <PatrioticScene
        compact
        className="min-h-screen"
        contentClassName="flex min-h-screen items-center justify-center px-4 py-10"
      >
        <div className="w-full max-w-md rounded-3xl bg-white p-6 text-navy shadow-2xl sm:p-8">
          <h1 className="font-display text-4xl tracking-[0.08em]">Alterar senha</h1>
          <p className="mt-2 text-sm text-navy/65">
            Por segurança, troque a senha inicial antes de usar o painel.
          </p>
          <div className="mt-5">
            <PasswordChangeForm firstLogin />
          </div>
        </div>
      </PatrioticScene>
    );
  }

  return (
    <SiteShell profile={profile} showFooter={false}>
      <main className="mx-auto w-full max-w-md px-4 py-10 pb-24 md:pb-10">
        <div className="rounded-3xl bg-white p-6 shadow-[0_12px_30px_rgba(6,28,58,0.06)]">
          <h1 className="font-display text-3xl tracking-[0.08em]">Alterar senha</h1>
          <p className="mt-2 text-sm text-navy/65">Escolha uma senha nova para a sua conta.</p>
          <div className="mt-5">
            <PasswordChangeForm />
          </div>
        </div>
        {isStaff(profile.role) ? <AdminBottomNav /> : <StudentBottomNav />}
      </main>
    </SiteShell>
  );
}
