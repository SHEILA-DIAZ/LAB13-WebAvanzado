"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FaGithub } from "react-icons/fa";

export default function GitHubSignInButton({ configured }: { configured: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <>
    <button type="button" className="button-secondary w-full gap-3 py-3" disabled={!configured || pending} onClick={async () => {
      setPending(true);
      setError(false);
      try { await signIn("github", { callbackUrl: "/dashboard" }); }
      catch { setError(true); setPending(false); }
    }}><FaGithub aria-hidden="true" />{pending ? "Conectando…" : "Continuar con GitHub"}</button>
    {!configured && <p className="mt-2 text-xs text-slate-500">GitHub estará disponible al configurar sus credenciales OAuth.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">No se pudo conectar con GitHub.</p>}
  </>;
}
