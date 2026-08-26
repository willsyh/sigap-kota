"use client";

import { useEffect, useState } from "react";

/**
 * Helper client-side untuk reverse geocoding (koordinat -> nama tempat).
 * Memakai /api/geocode (proxy Nominatim sisi server) dengan cache in-memory
 * di modul ini agar daftar kartu tidak membanjiri API untuk koordinat yang
 * sama. Gagal fetch selalu mengembalikan null; pemanggil wajib menyediakan
 * fallback tampilan koordinat.
 */

interface PlaceCacheEntry {
  name: string;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, PlaceCacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

function cacheKey(lat: number, lng: number): string {
  // 4 desimal ~ 11 meter: cukup untuk menampilkan nama jalan/kelurahan.
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/** Potong display_name Nominatim menjadi bagian paling relevan. */
function shortenDisplayName(raw: string): string {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.slice(0, 3).join(", ");
}

export async function fetchPlaceName(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = cacheKey(lat, lng);

  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.name;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lng}`);
      if (!res.ok) return null;
      const data: unknown = await res.json().catch(() => null);
      const raw =
        typeof data === "object" && data !== null && "display_name" in data
          ? (data as { display_name?: unknown }).display_name
          : null;
      if (typeof raw !== "string" || raw.length === 0) return null;
      const name = shortenDisplayName(raw);
      cache.set(key, { name, expiresAt: Date.now() + CACHE_TTL_MS });
      return name;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/**
 * Hook untuk menampilkan nama tempat pada komponen klien.
 * Mengembalikan null sampai hasil diterima; pemanggil menampilkan fallback.
 */
export function usePlaceName(
  lat: number | null | undefined,
  lng: number | null | undefined,
): string | null {
  const [name, setName] = useState<string | null>(() =>
    typeof lat === "number" && typeof lng === "number"
      ? cache.get(cacheKey(lat, lng))?.name ?? null
      : null,
  );

  useEffect(() => {
    if (typeof lat !== "number" || typeof lng !== "number") return;
    let cancelled = false;
    fetchPlaceName(lat, lng).then((result) => {
      if (!cancelled && result) setName(result);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return name;
}
