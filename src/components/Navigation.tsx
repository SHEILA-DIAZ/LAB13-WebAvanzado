import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default function Navigation({ authenticated }: { authenticated: boolean }) {
  return <header className="border-b border-slate-200 bg-white"><nav aria-label="Navegación principal" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
    <Link href="/" className="text-xl font-bold tracking-tight text-indigo-700">LAB13 <span className="font-normal text-slate-500">/ NextAuth</span></Link>
    <div className="flex flex-wrap items-center gap-5 text-sm font-semibold">
      <Link href="/">Inicio</Link>
      {authenticated ? <><Link href="/dashboard">Dashboard</Link><Link href="/profile">Perfil</Link><LogoutButton /></> : <Link className="button-primary" href="/signin">Iniciar sesión</Link>}
    </div>
  </nav></header>;
}
