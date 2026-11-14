import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, openSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const temp = mkdtempSync(join(tmpdir(), "lab13-oauth-test-"));
const base = "http://localhost:3014";
const databasePath = join(temp, "must-not-be-created.sqlite");
const logPath = join(temp, "server.log");
const log = openSync(logPath, "a");
// Public fixture IDs and random secrets are used only in this isolated process.
// These tests exercise authorization redirects, not a real provider login.
const fixture = {
  GITHUB_ID: "lab13-github-fixture",
  GOOGLE_CLIENT_ID: "lab13-google-fixture.apps.googleusercontent.com",
};
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3014"], {
  env: {
    ...process.env,
    ...fixture,
    GITHUB_SECRET: randomBytes(24).toString("hex"),
    GOOGLE_CLIENT_SECRET: randomBytes(24).toString("hex"),
    NEXTAUTH_SECRET: randomBytes(32).toString("hex"),
    NEXTAUTH_URL: base,
    VERCEL: "1",
    AUTH_DB_PATH: databasePath,
  },
  windowsHide: true,
  stdio: ["ignore", log, log],
});
const cookies = new Map();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let passed = 0;

function check(name, value) {
  assert.ok(value, name);
  passed++;
  console.log("OK: " + name);
}
async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  headers.set("Cookie", [...cookies].map(([name, value]) => name + "=" + value).join("; "));
  const response = await fetch(base + path, { ...options, headers, redirect: "manual" });
  for (const cookie of response.headers.getSetCookie()) {
    const part = cookie.split(";")[0], index = part.indexOf("=");
    cookies.set(part.slice(0, index), part.slice(index + 1));
  }
  return response;
}
async function startSignIn(provider, csrfToken) {
  const response = await request("/api/auth/signin/" + provider, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: base },
    body: new URLSearchParams({ csrfToken, callbackUrl: base + "/dashboard", json: "true" }),
  });
  return new URL((await response.json()).url, base);
}

try {
  server.on("error", error => console.error(error.message));
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + "/api/auth/providers")).ok) break; } catch {}
    if (i === 99) throw new Error("Server failed to start: " + readFileSync(logPath, "utf8").slice(-2000));
    await pause(300);
  }
  const providers = await (await request("/api/auth/providers")).json();
  check("Google and GitHub remain registered together", !!providers.google && !!providers.github && !!providers.credentials);
  for (const provider of ["google", "github"]) {
    check(provider + " callback belongs to this environment", providers[provider].callbackUrl === base + "/api/auth/callback/" + provider);
  }
  const html = await (await request("/signin")).text();
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  for (const provider of ["Google", "GitHub"]) {
    const button = buttons.find(match => match[2].includes("Continuar con " + provider));
    check(provider + " button exists and is enabled", !!button && !/\bdisabled\b/.test(button[1]));
  }
  for (const route of ["/dashboard", "/profile", "/dashboard/private", "/profile/private"]) {
    const response = await request(route);
    const redirect = new URL(response.headers.get("location"), base);
    check(route + " redirects anonymous users to custom sign-in", response.status === 307 && redirect.pathname === "/signin");
  }
  const missingCsrf = await startSignIn("github", "");
  check("OAuth rejects missing CSRF token", missingCsrf.origin === base);
  const csrfToken = (await (await request("/api/auth/csrf")).json()).csrfToken;
  for (const provider of ["github", "google"]) {
    const url = await startSignIn(provider, csrfToken);
    check(provider + " starts at the real authorization endpoint",
      provider === "github" ? url.origin === "https://github.com" && url.pathname === "/login/oauth/authorize" : url.origin === "https://accounts.google.com");
    check(provider + " uses the expected client ID", url.searchParams.get("client_id") === fixture[provider === "github" ? "GITHUB_ID" : "GOOGLE_CLIENT_ID"]);
    check(provider + " uses the correct redirect URI", url.searchParams.get("redirect_uri") === base + "/api/auth/callback/" + provider);
    check(provider + " includes OAuth state", !!url.searchParams.get("state"));
    const callbackCookie = cookies.get("next-auth.callback-url");
    check(provider + " preserves dashboard as final destination", decodeURIComponent(callbackCookie ?? "") === base + "/dashboard");
  }
  // Invalid state must be rejected before any authorization code is exchanged.
  const invalid = await request("/api/auth/callback/github?code=invalid-fixture&state=invalid-state");
  const rejected = new URL(invalid.headers.get("location"), base);
  check("Invalid callback cannot create a session", invalid.status === 302 && rejected.origin === base && JSON.stringify(await (await request("/api/auth/session")).json()) === "{}");
  check("OAuth does not create or require the credentials database", !existsSync(databasePath));
  console.log(passed + " OAuth checks passed. Real Google/GitHub account login was NOT tested.");
} catch (error) {
  console.error(error.message);
  console.error("Server log: " + logPath);
  process.exitCode = 1;
} finally {
  server.kill();
}
