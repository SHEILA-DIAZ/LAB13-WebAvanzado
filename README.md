# Laboratorio 13 — Autenticación y seguridad

Next.js 15 + NextAuth.js 4. Acceso con Google, GitHub o correo y contraseña.

## Ejecutar

Requiere Node.js 22.13 o superior (SQLite integrado).

1. Ejecutar `npm install`.
2. Copiar `.env.example` a `.env.local`.
3. Definir `NEXTAUTH_SECRET` con un valor aleatorio de al menos 32 bytes y `NEXTAUTH_URL=http://localhost:3000`.
4. Ejecutar `npm run dev` y abrir http://localhost:3000.

El registro y el acceso por contraseña funcionan sin credenciales OAuth. Crear una cuenta en /register y entrar en /signin.

## Requisitos de la tarea

- CredentialsProvider valida las credenciales contra SQLite.
- Registro con validación en cliente y servidor, correo normalizado y restricción UNIQUE.
- bcryptjs con coste 12. Solo se almacena el hash; nunca la contraseña en texto plano.
- Cinco fallos consecutivos bloquean la cuenta por 15 minutos. El bloqueo se guarda en SQLite y sobrevive a reinicios. Un acceso correcto reinicia el contador. Los intentos durante el bloqueo no lo prolongan.
- GitHubProvider y GoogleProvider, activados solo al configurar sus credenciales.
- Sesiones JWT de 8 horas y rutas /dashboard y /profile protegidas.
- El perfil indica el proveedor con el que se inició sesión.

## Configurar OAuth

Google: configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET. URI autorizada:
http://localhost:3000/api/auth/callback/google

GitHub: crear una OAuth App en https://github.com/settings/developers.
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/callback/github
Copiar Client ID en GITHUB_ID y Client secret en GITHUB_SECRET.
Reiniciar el servidor tras modificar variables.

Las credenciales del plugin de GitHub de ChatGPT no sustituyen las de esta OAuth App.

Documentación: https://next-auth.js.org/providers/credentials y https://next-auth.js.org/providers/github

## Datos y despliegue

Las cuentas y bloqueos se guardan en data/auth.sqlite, excluido de Git.
AUTH_DB_PATH permite escoger otro archivo, por ejemplo en un volumen persistente.
No compartir ni subir esa base: contiene datos de cuentas y hashes.

Esta implementación funciona localmente o en un servidor Node con disco persistente.
Vercel no ofrece disco local persistente para SQLite. Antes de desplegar allí hay que migrar el almacenamiento a una base remota (por ejemplo PostgreSQL o Turso). Usar /tmp perdería cuentas y bloqueos y no constituye un despliegue válido.
No se incluye un enlace de despliegue ficticio.

## Verificar

`npm run lint`
`npx tsc --noEmit`
`npm run build`

Pruebas de integración y evidencias: `node scripts/test-auth.mjs` (después de compilar).
Usan un puerto y base temporal propios; no modifican las cuentas del usuario.
Las capturas usan una cuenta de prueba registrada realmente por el formulario/API; no simulan sesiones OAuth.


## OAuth en Vercel

Aplicación: https://lab13-web-avanzado-one.vercel.app

En Production deben existir exactamente estas variables:
- GITHUB_ID y GITHUB_SECRET (OAuth App de GitHub).
- GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET (cliente OAuth web de Google).
- NEXTAUTH_SECRET (secreto de sesiones).
- NEXTAUTH_URL=https://lab13-web-avanzado-one.vercel.app

Callback de GitHub:
https://lab13-web-avanzado-one.vercel.app/api/auth/callback/github

En Google Cloud, conservar el callback local y añadir también:
https://lab13-web-avanzado-one.vercel.app/api/auth/callback/google

GitHub OAuth en localhost se configura con otra OAuth App de desarrollo y su callback
http://localhost:3000/api/auth/callback/github. No copiar credenciales de Production a Git.
Google y GitHub usan sesiones JWT y no necesitan la base SQLite para iniciar sesión.
La limitación de SQLite en Vercel afecta al registro y acceso por contraseña, no al acceso OAuth.

Tras cambiar las variables, ejecutar un nuevo despliegue. En Vercel > Settings > Git,
confirmar el repositorio SHEILA-DIAZ/LAB13-WebAvanzado y la rama de producción main.
En Deployments, comprobar que el commit desplegado coincida con el último commit subido.

## Pruebas de OAuth y comprobación manual

Después de compilar: `npm test`.
`npm run test:oauth` utiliza identificadores de prueba y secretos aleatorios en un servidor
aislado. Comprueba los proveedores, botones, callbacks, protección de rutas, CSRF y
rechazo de callbacks inválidos. No intercambia códigos ni prueba un acceso real a Google o GitHub.
La prueba de Google consulta su documento público de descubrimiento y requiere internet.

En producción, probar por separado en una ventana privada:
1. Abrir /dashboard sin sesión: debe redirigir a /signin.
2. Elegir Continuar con GitHub, autorizar la OAuth App y volver a /dashboard.
3. Abrir /profile y comprobar que el proveedor es GitHub.
4. Cerrar sesión; /dashboard y /profile deben volver a pedir acceso.
5. Repetir el flujo con Google y comprobar que el perfil indica Google.

No considerar el flujo OAuth validado hasta completar estas pruebas con cuentas reales.
