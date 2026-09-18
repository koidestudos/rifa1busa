import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { SiteShell } from "@/components/layout/SiteShell";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <SiteShell profile={profile}>
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <section className="star-field rounded-3xl p-6 text-white">
          <h1 className="font-display text-3xl">Alterar senha</h1>
          <p className="mt-2 text-sm text-white/75">
            {profile.must_change_password
              ? "Por segurança, troque a senha inicial antes de usar o painel."
              : "Escolha uma senha nova para a sua conta."}
          </p>
        </section>
        <div className="card-surface mt-5 rounded-3xl p-5">
          <PasswordChangeForm firstLogin={profile.must_change_password} />
        </div>
      </main>
    </SiteShell>
  );
}
