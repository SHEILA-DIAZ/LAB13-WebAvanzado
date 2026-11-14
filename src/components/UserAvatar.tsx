import Image from "next/image";
import type { Session } from "next-auth";

export default function UserAvatar({ user }: { user: Session["user"] }) {
  const image = user?.image;
  const allowed = image && /^https:\/\/(?:lh3\.googleusercontent\.com|avatars\.githubusercontent\.com)\//.test(image);
  return allowed ? <Image src={image} alt={`Foto de ${user?.name ?? "usuario"}`} width={80} height={80} className="rounded-full" referrerPolicy="no-referrer" /> : <span aria-label="Avatar de usuario" className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-700">{user?.name?.charAt(0).toUpperCase() || "U"}</span>;
}
