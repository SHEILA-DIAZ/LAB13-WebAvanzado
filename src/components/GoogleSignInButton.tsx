"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { FaGoogle } from "react-icons/fa";

export default function GoogleSignInButton({ configured }: { configured: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <>
    <button className="button-primary w-full" disabled={!configured || pending} onClick={async () => {
      setPending(true);
      setError(false);
      try { await signIn("google", { callbackUrl: "/dashboard" }); }
      catch { setError(true); setPending(false); }
    }}><FaGoogle aria-hidden="true" />{pending ? "Conectando…" : "Continuar con Google"}</button>
    {error && <p role="alert" className="mt-4 text-red-700">No se pudo conectar. Inténtalo de nuevo.</p>}
  </>;
}
