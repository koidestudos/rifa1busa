import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { getRoletaNumbers, getSorteioHistory } from "@/lib/queries";
import { RoletaStudio } from "@/components/roleta/RoletaStudio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roleta | Rifa Feira dos Países 2026",
  description: "Sorteio ao vivo da Rifa Feira dos Países 2026 para captura no OBS Studio.",
};

export default async function RoletaPage() {
  const profile = await requireStaff();
  const [numbers, history] = await Promise.all([getRoletaNumbers(), getSorteioHistory()]);

  return (
    <RoletaStudio
      isSuperAdmin={profile.role === "super_admin"}
      initialNumbers={numbers}
      initialHistory={history}
    />
  );
}
