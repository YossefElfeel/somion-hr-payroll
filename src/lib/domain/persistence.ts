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
// **Performance**: Fluid Compute keeps a warm Node instance for many seconds.
// We cache the snapshot's "last loaded at" timestamp on globalThis. Within
// the TTL window, loadStore is a no-op — we trust whatever's already in
// memory (which we ourselves just wrote, or which we loaded a moment ago).
// This collapses 90% of the Redis round-trips on a busy session.
//
// If the Upstash env vars aren't set (e.g., during a fresh Vercel deploy
// before the integration is provisioned, or local dev), we silently fall
// back to in-memory only, so the build doesn't crash.

import { Redis } from "@upstash/redis";
import type { Store } from "./store";
import { _internalGetStore, _internalSetStore } from "./store";

const KEY = "somion-store-v1";

// Cache window for load. Lower = more consistency across instances at the
// cost of more Redis GETs. 2s is plenty for a single user clicking through
// the app — a stale read can happen but the next save fixes it.
const LOAD_TTL_MS = 2000;

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

// Per-instance freshness markers held on globalThis so they survive HMR and
// share between server actions + Server Components on the same warm Fluid
// Compute instance.
interface CacheMeta {
  loadedAt?: number; // last time loadStore actually fetched from Redis
  dirtySince?: number; // most recent save attempt — newer than loadedAt means
  // a save happened locally and we should not re-load
  // until at least the next TTL window
}
const G = globalThis as unknown as { __somionPersist?: CacheMeta };
function meta(): CacheMeta {
  if (!G.__somionPersist) G.__somionPersist = {};
  return G.__somionPersist;
}

// Load the stored snapshot into globalThis. Caches per-instance to avoid
// fetching on every request when the warm instance was just here.
export async function loadStore(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const m = meta();
  const now = Date.now();
  // Skip the GET if we either fetched recently or just wrote (we trust our
  // own in-memory snapshot).
  if (m.loadedAt && now - m.loadedAt < LOAD_TTL_MS) return;
  if (m.dirtySince && now - m.dirtySince < LOAD_TTL_MS) return;
  try {
    const data = await redis.get<Store>(KEY);
    if (data) _internalSetStore(data);
    m.loadedAt = Date.now();
  } catch (err) {
    console.error("[persistence] loadStore failed:", err);
  }
}

// Save the current globalThis snapshot back to Redis. Marks the cache as
// dirty so the next loadStore on this instance will trust our local copy
// rather than re-fetching.
export async function saveStore(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const m = meta();
  try {
    const snapshot = _internalGetStore();
    await redis.set(KEY, snapshot);
    m.dirtySince = Date.now();
    m.loadedAt = m.dirtySince;
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
