"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <div>
    <button className="button-secondary" disabled={pending} onClick={async () => {
      setPending(true);
      setError(false);
      try { await signOut({ callbackUrl: "/signin" }); }
      catch { setError(true); setPending(false); }
    }}>{pending ? "Cerrando sesión…" : "Cerrar sesión"}</button>
    {error && <p role="alert">No se pudo cerrar la sesión. Inténtalo de nuevo.</p>}
  </div>;
}
