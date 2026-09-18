import { getAllNumbersWithOwners, getProfiles } from "@/lib/queries";
import { NumberTable } from "@/components/admin/NumberTable";

export const dynamic = "force-dynamic";

export default async function NumerosPage() {
  const [numbers, profiles] = await Promise.all([
    getAllNumbersWithOwners(),
    getProfiles(),
  ]);

  return (
    <section>
      <h1 className="mb-4 font-display text-3xl tracking-[0.08em]">Controle da Rifa</h1>
      <NumberTable
        numbers={numbers}
        students={profiles.map((profile) => ({ id: profile.id, nome: profile.nome }))}
      />
    </section>
  );
}
