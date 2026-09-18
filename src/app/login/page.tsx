import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, homePathForRole } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { PatrioticScene, UsaFlag } from "@/components/brand/Decor";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(homePathForRole(profile.role, profile.must_change_password));
  }

  return (
    <PatrioticScene
      compact
      className="min-h-screen"
      contentClassName="flex min-h-screen items-center justify-center px-4 py-10"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-navy shadow-2xl sm:p-8">
        <div className="mb-5 text-center">
          <UsaFlag className="mx-auto h-8 w-12" />
          <h1 className="mt-3 font-display text-4xl tracking-[0.08em]">Entrar na Rifa</h1>
          <p className="mt-1 text-sm font-semibold text-navy/55">Feira dos Países 2026</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="font-semibold text-navy/60 underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </PatrioticScene>
  );
}
