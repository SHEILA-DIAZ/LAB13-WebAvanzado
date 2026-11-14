"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CredentialsForm({ registered }: { registered: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
        redirect: false,
      });
      if (result?.error) {
        setError(result.error === "AccountLocked"
          ? "Cuenta bloqueada durante 15 minutos por 5 intentos fallidos. Espera antes de volver a intentarlo."
          : "Correo o contraseña incorrectos.");
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } catch { setError("No se pudo conectar. Inténtalo de nuevo."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4 text-left">
    {registered && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Cuenta creada. Inicia sesión para continuar.</p>}
    <div><label htmlFor="email" className="field-label">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="field" /></div>
    <div><label htmlFor="password" className="field-label">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <button disabled={pending} className="button-primary w-full">{pending ? "Ingresando…" : "Iniciar sesión"}</button>
    <p className="text-xs leading-5 text-slate-500">Después de 5 intentos fallidos, la cuenta se bloquea durante 15 minutos.</p>
  </form>;
}
