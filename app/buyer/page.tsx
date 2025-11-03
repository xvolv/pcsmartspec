"use client";

import { useEffect, useMemo, useState } from "react";

type StorageItem = { Model: string; Size_GB: number; Type: string; BusType: string };

type Listing = {
  id: string;
  Brand: string;
  Model: string;
  CPU: string;
  RAM_GB: string;
  RAM_Type: string;
  RAM_Speed_MHz: string;
  Storage: StorageItem[];
  GPU: string;
  Display_Resolution: string;
  Screen_Size_inch: number;
  OS: string;
  price: number;
  description: string;
  images: string[];
  imageUrl: string | null;
  createdAt: string;
  status: string;
};

function prettyStorage(items: StorageItem[]) {
  if (!items?.length) return "—";
  const kinds = Array.from(new Set(items.map(s => [s.Type, s.BusType].filter(Boolean).join(" ")))).filter(Boolean).join(", ");
  const total = items.reduce((sum, s) => sum + (Number(s.Size_GB) || 0), 0);
  return `${Math.round(total)} GB${kinds ? ` · ${kinds}` : ""}`;
}

export default function BuyerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const t = Date.now();
        const res = await fetch(`/api/listings?t=${t}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load listings: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setListings(data.data || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load listings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(l =>
      [l.Brand, l.Model, l.CPU, l.GPU, l.OS].some(v => (v || "").toLowerCase().includes(q))
    );
  }, [query, listings]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <div className="mb-4 sm:mb-0 sm:flex sm:items-end sm:justify-between sm:gap-4">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Available PCs</h1>
            <p className="text-sm text-zinc-500 mt-1">Browse published listings and request to buy</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              placeholder="Search brand, model, CPU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72 rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="h-4 w-1/2 rounded bg-zinc-200 mb-2" />
              <div className="h-48 rounded-lg bg-zinc-100 mb-3" />
              <div className="h-3 w-2/3 rounded bg-zinc-100 mb-2" />
              <div className="h-3 w-1/2 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <a
              key={l.id}
              href={`/listings/${l.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 sm:p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200 active:scale-[0.99]"
            >
              {/* Header with Brand, Model, Price */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-blue-600 truncate">{l.Brand}</div>
                  <div className="text-base font-bold text-gray-900 line-clamp-2 leading-tight">{l.Model}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-blue-600 whitespace-nowrap">{l.price?.toLocaleString()} ETB</div>
                </div>
              </div>

              {/* Image */}
              {l.imageUrl && (
                <div className="relative h-40 sm:h-48 w-full mb-3 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={l.images?.[0]}
                    alt={`${l.Brand} ${l.Model}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-laptop.jpg';
                    }}
                  />
                </div>
              )}

              {/* Description - Condensed for mobile */}
              {l.description && (
                <div className="mb-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {l.description}
                </div>
              )}

              {/* Key Specs - Compact layout */}
              <div className="mb-4 space-y-1.5 text-xs text-gray-700">
                <div className="flex items-start">
                  <span className="text-gray-500 min-w-[60px]">CPU:</span>
                  <span className="flex-1 line-clamp-1">{l.CPU}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 min-w-[60px]">RAM:</span>
                  <span className="flex-1">{l.RAM_GB}GB {l.RAM_Type}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 min-w-[60px]">GPU:</span>
                  <span className="flex-1 line-clamp-1">{l.GPU}</span>
                </div>
                <div className="hidden sm:flex items-start">
                  <span className="text-gray-500 min-w-[60px]">Storage:</span>
                  <span className="flex-1 line-clamp-1">{prettyStorage(l.Storage)}</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="w-full">
                <div className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                  View Details
                </div>
              </div>
            </a>
          ))}
          {!filtered.length && (
            <div className="col-span-full rounded-md border border-gray-200 bg-white p-6 sm:p-8 text-center text-sm text-zinc-600">
              {query ? (
                <div>
                  <p className="mb-2 text-base font-medium">No listings found</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-base font-medium">No published listings yet</p>
                  <p className="text-sm">Please check back later</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
