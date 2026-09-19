import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { readReceipt } from "@/lib/firebase/receipts";
import { canAccessStudentRecords } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ numeroId: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const { numeroId } = await params;
  if (!numeroId || !/^\d{1,3}$/.test(numeroId)) {
    return NextResponse.json({ error: "Comprovante indisponível." }, { status: 400 });
  }

  const receipt = await readReceipt(numeroId);
  if (!receipt) {
    return NextResponse.json({ error: "Comprovante indisponível." }, { status: 404 });
  }

  const allowed = await canAccessStudentRecords(profile, receipt.alunoId);
  if (!allowed) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  return new NextResponse(new Uint8Array(receipt.bytes), {
    headers: {
      "Content-Type": receipt.contentType,
      "Cache-Control": "private, no-store",
    },
  });
}
