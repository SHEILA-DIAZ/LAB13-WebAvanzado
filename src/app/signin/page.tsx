import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions, googleConfigured, githubConfigured } from "@/lib/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import GitHubSignInButton from "@/components/GitHubSignInButton";
import CredentialsForm from "@/components/CredentialsForm";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  if (await getServerSession(authOptions)) redirect("/dashboard");
  const { error, registered } = await searchParams;
  const errors: Record<string, string> = {
    AccessDenied: "El acceso fue denegado. Revisa los permisos de tu cuenta.",
    OAuthAccountNotLinked: "Esta cuenta ya está vinculada a otro método de acceso.",
    Configuration: "La configuración de autenticación está incompleta.",
    AccountLocked: "Cuenta bloqueada durante 15 minutos por 5 intentos fallidos.",
    CredentialsSignin: "Correo o contraseña incorrectos.",
  };
  return <main className="flex min-h-screen items-center justify-center px-6 py-10"><section className="card w-full max-w-md text-center">
    <p className="eyebrow">LABORATORIO 13</p>
    <h1 className="mt-3 text-3xl font-bold">Bienvenido de nuevo</h1>
    <p className="mb-6 mt-3 text-slate-600">Accede con tu correo o una cuenta vinculada.</p>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{errors[error] ?? "No se pudo iniciar sesión. Inténtalo de nuevo."}</p>}
    <CredentialsForm registered={registered === "1"} />
    <p className="my-5 text-sm text-slate-400">O continúa con</p>
    <div className="space-y-3"><GoogleSignInButton configured={googleConfigured} /><GitHubSignInButton configured={githubConfigured} /></div>
    {!googleConfigured && <p className="mt-2 text-xs text-slate-500">Google requiere sus credenciales OAuth.</p>}
    <p className="mt-6 text-sm text-slate-600">¿No tienes cuenta? <Link className="font-semibold text-indigo-700" href="/register">Regístrate</Link></p>
    <Link href="/" className="mt-4 inline-block text-sm font-semibold text-indigo-700">Volver al inicio</Link>
  </section></main>;
}
