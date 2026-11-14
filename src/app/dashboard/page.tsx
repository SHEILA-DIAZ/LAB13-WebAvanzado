import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { providerLabel } from "@/lib/provider-label";
import Navigation from "@/components/Navigation";
import UserAvatar from "@/components/UserAvatar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  return <><Navigation authenticated /><main className="mx-auto max-w-5xl px-6 py-12">
    <p className="eyebrow">DASHBOARD</p><h1 className="mt-3 text-3xl font-bold">Hola, {session.user?.name ?? "usuario"}</h1><p className="mt-3 text-slate-600">Este es tu espacio personal.</p>
    <section className="card mt-8 flex flex-wrap items-center gap-6"><UserAvatar user={session.user} /><div><h2 className="text-xl font-bold">{session.user?.name ?? "Sin nombre"}</h2><p className="mt-1 break-all text-slate-600">{session.user?.email ?? "Correo no disponible"}</p><span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">Sesión activa · {providerLabel(session.provider)}</span></div></section>
    <section className="card mt-6"><h2 className="text-xl font-bold">Información de tu cuenta</h2><p className="mb-5 mt-2 text-slate-600">Revisa los datos de tu cuenta.</p><Link className="button-primary" href="/profile">Ver mi perfil</Link></section>
  </main></>;
}
