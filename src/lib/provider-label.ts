export function providerLabel(provider?: string) {
  return ({ credentials: "Correo y contraseña", google: "Google", github: "GitHub" } as Record<string, string>)[provider ?? ""] ?? "Cuenta";
}
