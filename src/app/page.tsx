import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navigation from "@/components/Navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  return <><Navigation authenticated={Boolean(session)} /><main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
    <p className="eyebrow">DESARROLLO DE APLICACIONES WEB AVANZADO</p>
    <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Tu espacio, con acceso seguro.</h1>
    <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Acceso con correo, Google y GitHub mediante NextAuth.js. Accede a tu dashboard y consulta los datos de tu cuenta desde un solo lugar.</p>
    <Link className="button-primary mt-8" href={session ? "/dashboard" : "/signin"}>{session ? "Ir a mi dashboard" : "Comenzar"}<span aria-hidden="true"> →</span></Link>
    <div className="mt-16 grid gap-5 md:grid-cols-3">{[["01", "Tres formas de acceso", "Utiliza tu correo, Google o GitHub para identificarte."], ["02", "Tu sesión", "Consulta tu información durante la sesión activa."], ["03", "Rutas privadas", "Dashboard y perfil disponibles al iniciar sesión."]].map(([number, title, description]) => <section className="card" key={number}><p className="eyebrow">{number}</p><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></section>)}</div>
  </main></>;
}
