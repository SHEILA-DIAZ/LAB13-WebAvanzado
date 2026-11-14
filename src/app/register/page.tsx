import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  return <main className="flex min-h-screen items-center justify-center px-6 py-10"><section className="card w-full max-w-md text-center">
    <p className="eyebrow">LABORATORIO 13</p>
    <h1 className="mt-3 text-3xl font-bold">Crea tu cuenta</h1>
    <p className="mb-6 mt-3 text-slate-600">Regístrate con tu correo y una contraseña.</p>
    <RegisterForm />
    <p className="mt-6 text-sm text-slate-600">¿Ya tienes cuenta? <Link className="font-semibold text-indigo-700" href="/signin">Inicia sesión</Link></p>
    <Link href="/" className="mt-4 inline-block text-sm text-indigo-700">Volver al inicio</Link>
  </section></main>;
}
