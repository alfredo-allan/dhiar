/**
 * Sessão do painel admin: cookie httpOnly assinado com HMAC (Web Crypto,
 * funciona no proxy e nas rotas). A senha fica SÓ na variável de ambiente
 * ADMIN_PASSWORD - nunca no código nem no repositório.
 *
 * Mesmo desenho do Stoa OS. Em desenvolvimento, sem ADMIN_PASSWORD, o painel
 * fica aberto para facilitar; em produção, nunca.
 */

export const ADMIN_COOKIE = "dhiar_admin";
export const SESSION_DAYS = 7;

const enc = new TextEncoder();

function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

export function adminOpenInDev(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD;
}

function b64url(buf: ArrayBuffer): string {
  let s = "";
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string, key: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD não configurada");
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${await hmac(payload, key)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const exp = Number(payload.split(".")[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(sig, await hmac(payload, key));
}

/** Compara a senha digitada com ADMIN_PASSWORD sem vazar tamanho/tempo. */
export async function checkPassword(input: string): Promise<boolean> {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const pepper = "dhiar-admin";
  return safeEqual(await hmac(input, pepper), await hmac(real, pepper));
}

export async function isAdminRequest(cookieValue: string | undefined): Promise<boolean> {
  if (adminOpenInDev()) return true;
  return verifySessionToken(cookieValue);
}
