import { redirect } from "next/navigation";
import { getCurrentProfile, homePathForRole } from "@/lib/auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(homePathForRole(profile.role, profile.must_change_password));
  }

  return (
    <SiteShell>
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-10">
        <section className="star-field rounded-3xl p-6 text-white">
          <p className="text-3xl">🇺🇸</p>
          <h1 className="mt-2 font-display text-3xl">Entrar na Rifa 🇺🇸</h1>
          <p className="mt-2 text-sm text-white/75">
            Use o login e a senha da sua turma.
          </p>
        </section>
        <div className="card-surface mt-5 rounded-3xl p-5">
          <LoginForm />
        </div>
      </main>
    </SiteShell>
  );
}
