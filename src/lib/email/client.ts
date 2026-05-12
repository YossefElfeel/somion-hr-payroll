// Lazy Resend client. Returns null when RESEND_API_KEY isn't set so the rest
// of the app (and CI / local dev) keeps working — `send.ts` falls back to
// logging the payload in that case. Mirrors the persistence layer's posture
// of silently degrading when its env vars aren't provided.

import { Resend } from "resend";

let _resend: Resend | null | undefined;

export function getResend(): Resend | null {
  if (_resend !== undefined) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    _resend = null;
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

export function defaultFrom(): string {
  return process.env.EMAIL_FROM ?? "Somion HR <onboarding@resend.dev>";
}

export function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
