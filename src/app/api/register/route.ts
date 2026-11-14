import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, registerUser, validEmail, validPassword } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: "Formulario demasiado grande." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Formulario no válido." }, { status: 400 });
  }
  const input = body as Record<string, unknown> | null;
  if (!input || typeof input.name !== "string" || typeof input.email !== "string" || typeof input.password !== "string") {
    return NextResponse.json({ error: "Completa todos los campos." }, { status: 400 });
  }
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  if (name.length < 2 || name.length > 80 || !validEmail(email) || !validPassword(input.password)) {
    return NextResponse.json({ error: "Usa un nombre de 2 a 80 caracteres, un correo válido y una contraseña de al menos 8 caracteres y máximo 72 bytes." }, { status: 400 });
  }
  try {
    const user = await registerUser(name, email, input.password);
    if (!user) return NextResponse.json({ error: "Este correo ya está registrado." }, { status: 409 });
    return NextResponse.json({ message: "Cuenta creada. Ya puedes iniciar sesión." }, { status: 201 });
  } catch (error) {
    console.error("No se pudo registrar la cuenta:", error instanceof Error ? error.message : "Error de almacenamiento");
    return NextResponse.json({ error: "No pudimos crear la cuenta. Inténtalo más tarde." }, { status: 500 });
  }
}
