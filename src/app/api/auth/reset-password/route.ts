import { NextRequest, NextResponse } from "next/server";
import { resetPasswordByIdentifier } from "@/lib/public-password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body?.identifier ?? "").trim();
    const password = String(body?.password ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");

    if (!identifier) {
      return NextResponse.json(
        { error: "Debes ingresar tu usuario o correo." },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Debes completar y confirmar la nueva contrasena." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contrasenas no coinciden." },
        { status: 400 }
      );
    }

    await resetPasswordByIdentifier(identifier, password);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo actualizar la contrasena.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
