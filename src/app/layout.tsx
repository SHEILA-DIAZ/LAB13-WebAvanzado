import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "LAB13 | Acceso seguro",
  description: "Autenticación y seguridad con Next.js y NextAuth.js",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><Provider>{children}</Provider></body></html>;
}
