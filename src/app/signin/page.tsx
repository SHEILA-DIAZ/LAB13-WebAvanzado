
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaGoogle } from "react-icons/fa";

export default function SignInPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Iniciar sesión
        </h1>

        <p className="mb-8 text-gray-600">
          Laboratorio 13 - Autenticación y Seguridad
        </p>

        <button
          onClick={() =>
            signIn("google", { callbackUrl: "/dashboard" })
          }
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          <FaGoogle />
          Continuar con Google
        </button>
      </div>
    </main>
  );
}
