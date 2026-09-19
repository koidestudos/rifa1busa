import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const uid = await getSessionUid();
  if (!uid) {
    return NextResponse.json(
      { ok: false },
      {
        status: 401,
        headers: {
          "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
        },
      },
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      },
    },
  );
}
