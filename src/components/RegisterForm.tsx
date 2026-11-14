"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (password !== data.get("confirmPassword")) { setError("Las contraseñas no coinciden."); return; }
    if (new TextEncoder().encode(password).length > 72) { setError("La contraseña debe ocupar como máximo 72 bytes."); return; }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("email"), password }) });
      const result = await response.json();
      if (!response.ok) setError(result.error ?? "No se pudo crear la cuenta.");
      else router.push("/signin?registered=1");
    } catch { setError("No se pudo conectar. Inténtalo de nuevo."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4 text-left">
    <div><label htmlFor="name" className="field-label">Nombre completo</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} className="field" /></div>
    <div><label htmlFor="email" className="field-label">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="field" /></div>
    <div><label htmlFor="password" className="field-label">Contraseña</label><input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="password-help" className="field" /><p id="password-help" className="mt-2 text-xs text-slate-500">Al menos 8 caracteres. Máximo 72 bytes.</p></div>
    <div><label htmlFor="confirmPassword" className="field-label">Repite la contraseña</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className="field" /></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <button disabled={pending} className="button-primary w-full">{pending ? "Creando cuenta…" : "Crear cuenta"}</button>
  </form>;
}
