import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { providerLabel } from "@/lib/provider-label";
import Navigation from "@/components/Navigation";
import UserAvatar from "@/components/UserAvatar";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");
  return <><Navigation authenticated /><main className="mx-auto max-w-5xl px-6 py-12"><p className="eyebrow">MI CUENTA</p><h1 className="mt-3 text-3xl font-bold">Perfil de usuario</h1><p className="mt-3 text-slate-600">Datos de tu sesión activa.</p><section className="card mt-8 max-w-2xl"><UserAvatar user={session.user} /><dl className="mt-8 space-y-6"><div><dt className="text-sm text-slate-500">Nombre</dt><dd className="mt-1 text-lg font-semibold">{session.user?.name ?? "No disponible"}</dd></div><div><dt className="text-sm text-slate-500">Correo electrónico</dt><dd className="mt-1 break-all text-lg font-semibold">{session.user?.email ?? "No disponible"}</dd></div><div><dt className="text-sm text-slate-500">Proveedor de acceso</dt><dd className="mt-1 font-semibold">{providerLabel(session.provider)}</dd></div></dl></section></main></>;
}
