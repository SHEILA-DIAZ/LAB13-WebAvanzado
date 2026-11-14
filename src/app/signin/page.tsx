import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions, googleConfigured } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  const { error } = await searchParams;
  const errors: Record<string, string> = {
    AccessDenied: "El acceso fue denegado. Revisa los permisos de tu cuenta de Google.",
    OAuthAccountNotLinked: "Esta cuenta ya está vinculada a otro método de acceso.",
    Configuration: "La configuración de autenticación está incompleta.",
  };
  return <main className="flex min-h-screen items-center justify-center px-6 py-12"><section className="card w-full max-w-md text-center">
    <p className="eyebrow">LABORATORIO 13</p>
    <h1 className="mt-3 text-3xl font-bold">Bienvenido de nuevo</h1>
    <p className="mb-8 mt-4 text-slate-600">Inicia sesión con tu cuenta de Google para acceder al dashboard y consultar tu perfil.</p>
    {error && <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{errors[error] ?? "No se pudo iniciar sesión con Google. Inténtalo de nuevo."}</p>}
    {!googleConfigured && <p role="status" className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">El acceso con Google estará disponible cuando se configuren las credenciales OAuth y el secreto de sesión.</p>}
    <GoogleSignInButton configured={googleConfigured} />
    <Link href="/" className="mt-7 inline-block text-sm font-semibold text-indigo-700">Volver al inicio</Link>
  </section></main>;
}
