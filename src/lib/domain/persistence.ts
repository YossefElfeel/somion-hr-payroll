// Persistence wrapper for the in-memory store so it survives across
// serverless function invocations on Vercel.
//
// The store is held on globalThis.__somionStore (see store.ts). On a single
// Node process (local dev) that's enough because every request hits the same
// process. On Vercel's serverless runtime, requests can land on different
// instances, each with its own globalThis — so we need to load from a shared
// backing store at the start of every request and save back after every
// mutation.
//
// We use Upstash Redis (Vercel Marketplace) and store the entire store as a
// single JSON blob. This keeps the existing synchronous `db.X()` API intact
// — callers just bracket their work with `loadStore()` / `saveStore()`.
//
// If the Upstash env vars aren't set (e.g., during a fresh Vercel deploy
// before the integration is provisioned, or local dev), we silently fall
// back to in-memory only, so the build doesn't crash.

import { Redis } from "@upstash/redis";
import type { Store } from "./store";
import { _internalGetStore, _internalSetStore } from "./store";

const KEY = "somion-store-v1";

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    _redis = null;
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

// Load the stored snapshot into globalThis. If Redis isn't configured or has
// no snapshot, leave the seeded in-memory store alone.
export async function loadStore(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const data = await redis.get<Store>(KEY);
    if (data) _internalSetStore(data);
  } catch (err) {
    // Don't crash the request if Redis hiccups — fall back to in-memory.
    console.error("[persistence] loadStore failed:", err);
  }
}

// Save the current globalThis snapshot back to Redis. Awaited so serverless
// doesn't tear down before the write completes.
export async function saveStore(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const snapshot = _internalGetStore();
    await redis.set(KEY, snapshot);
  } catch (err) {
    console.error("[persistence] saveStore failed:", err);
  }
}

// Convenience for server actions: load → run mutation → save.
export async function withStore<T>(fn: () => T | Promise<T>): Promise<T> {
  await loadStore();
  try {
    return await fn();
  } finally {
    await saveStore();
  }
}
