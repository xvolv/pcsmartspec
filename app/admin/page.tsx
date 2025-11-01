"use client";

import { useMemo, useState } from "react";

type StorageItem = {
  Model: string;
  Size_GB: number;
  Type: string;
  BusType: string;
};

type PcSpec = {
  Brand: string;
  Model: string;
  CPU: string;
  Cores: string;
  Threads: string;
  BaseSpeed_MHz: string;
  RAM_GB: string;
  RAM_Speed_MHz: string;
  RAM_Type: string;
  Storage: StorageItem[];
  GPU: string;
  Display_Resolution: string;
  Screen_Size_inch: number;
  OS: string;
  Scan_Time: string;
};

const sampleSpec: PcSpec = {
  Brand: "HP",
  Model: "Victus by HP Gaming Laptop 15-fa1xxx",
  CPU: "13th Gen Intel(R) Core(TM) i5-13420H",
  Cores: "8",
  Threads: "12",
  BaseSpeed_MHz: "2100",
  RAM_GB: "16",
  RAM_Speed_MHz: "3200",
  RAM_Type: "DDR4",
  Storage: [
    {
      Model: "PSENN512GA87FC0",
      Size_GB: 512.11,
      Type: "SSD",
      BusType: "NVMe",
    },
  ],
  GPU: "Intel(R) UHD Graphics, NVIDIA GeForce RTX 2050",
  Display_Resolution: "1920x1080",
  Screen_Size_inch: 15.6,
  OS: "Microsoft Windows 11 Home",
  Scan_Time: "2025-11-01T13:53:16.784566",
};

export default function AdminDashboard() {
  const [images, setImages] = useState<string[]>([]);
  const [guaranteeMonths, setGuaranteeMonths] = useState<number>(12);
  const [guaranteeProvider, setGuaranteeProvider] =
    useState<string>("PCSmartSpec");
  const [publishReady, setPublishReady] = useState<boolean>(false);

  const totalStorageGB = useMemo(
    () => sampleSpec.Storage.reduce((sum, s) => sum + s.Size_GB, 0),
    []
  );
  const ramSummary = useMemo(
    () => `${sampleSpec.RAM_GB}GB ${sampleSpec.RAM_Type} ${sampleSpec.RAM_Speed_MHz}MHz`,
    []
  );
  const storageKinds = useMemo(() => {
    const kinds = Array.from(
      new Set(
        (sampleSpec.Storage || []).map((s) =>
          [s.Type, s.BusType].filter(Boolean).join(" ")
        )
      )
    );
    return kinds.join(", ");
  }, []);

  const mockSold = useMemo(
    () => [
      {
        id: "ORD-1001",
        model: sampleSpec.Model,
        price: 799,
        buyer: "A. Bekele",
        date: "2025-10-12",
      },
      {
        id: "ORD-1002",
        model: sampleSpec.Model,
        price: 789,
        buyer: "M. Yusuf",
        date: "2025-10-24",
      },
      {
        id: "ORD-1003",
        model: "HP 255 G8",
        price: 550,
        buyer: "S. Hailu",
        date: "2025-11-01",
      },
    ],
    []
  );

  function onSelectImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImages((prev) => [...prev, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
              PS
            </div>
            <div>
              <h1 className="text-lg font-semibold">PCSmartSpec Admin</h1>
              <p className="text-xs text-zinc-500">
                Manage specs, media, guarantee, analytics, and sales
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Home
            </a>
            <button
              onClick={() => setPublishReady((v) => !v)}
              className={`rounded-md px-3 py-2 text-sm font-medium text-white ${
                publishReady ? "bg-emerald-600" : "bg-zinc-900"
              }`}
            >
              {publishReady ? "Ready to Publish" : "Mark as Ready"}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 lg:col-span-2 xl:col-span-2">
            <div className="text-sm text-zinc-500">Model</div>
            <div className="text-lg font-semibold truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">
              {sampleSpec.Model}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">CPU / RAM</div>
            <div className="text-lg font-semibold">
              {sampleSpec.CPU.split(" ")[0]} · {ramSummary}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">Storage Total</div>
            <div className="text-lg font-semibold">
              {totalStorageGB.toFixed(0)} GB{storageKinds ? ` · ${storageKinds}` : ""}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">Scan Time</div>
            <div className="text-lg font-semibold">
              {formatScanTime(sampleSpec.Scan_Time)}
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Spec Preview</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <SpecItem label="Brand" value={sampleSpec.Brand} />
                <SpecItem label="Model" value={sampleSpec.Model} />
                <SpecItem label="CPU" value={sampleSpec.CPU} />
                <SpecItem
                  label="Cores / Threads"
                  value={`${sampleSpec.Cores} / ${sampleSpec.Threads}`}
                />
                <SpecItem
                  label="Base Speed"
                  value={`${sampleSpec.BaseSpeed_MHz} MHz`}
                />
                <SpecItem
                  label="RAM"
                  value={`${sampleSpec.RAM_GB} GB ${sampleSpec.RAM_Type} @ ${sampleSpec.RAM_Speed_MHz} MHz`}
                />
                <SpecItem label="GPU" value={sampleSpec.GPU} />
                <SpecItem
                  label="Display"
                  value={`${sampleSpec.Display_Resolution} · ${sampleSpec.Screen_Size_inch}\"`}
                />
                <SpecItem label="OS" value={sampleSpec.OS} />
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium">Storage</div>
                <ul className="mt-2 divide-y rounded-md border bg-zinc-50">
                  {sampleSpec.Storage.map((s, i) => (
                    <li key={i} className="grid grid-cols-4 gap-2 p-3 text-sm">
                      <div className="col-span-2 truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">{s.Model}</div>
                      <div>
                        {s.Type}/{s.BusType}
                      </div>
                      <div className="text-right">{s.Size_GB} GB</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Photos</h2>
              <div className="flex items-center justify-between gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onSelectImages}
                  className="block w-full rounded-md border p-2 text-sm"
                />
                <button
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={!images.length || !publishReady}
                >
                  Attach to Listing
                </button>
              </div>
              {!!images.length && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((src, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-lg border bg-white"
                    >
                      <img
                        src={src}
                        alt={`upload-${idx}`}
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Guarantee</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">
                    Provider
                  </label>
                  <input
                    value={guaranteeProvider}
                    onChange={(e) => setGuaranteeProvider(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={guaranteeMonths}
                    onChange={(e) => setGuaranteeMonths(Number(e.target.value))}
                    className="w-full rounded-md border p-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={!publishReady}
                  >
                    Save Guarantee
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                This is a UI-only mock. No backend calls are made.
              </p>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Analytics</h2>
              <div className="space-y-3">
                <Bar label="Views" value={72} total={100} color="bg-blue-600" />
                <Bar
                  label="Saves"
                  value={38}
                  total={100}
                  color="bg-emerald-600"
                />
                <Bar
                  label="Share"
                  value={22}
                  total={100}
                  color="bg-violet-600"
                />
                <Bar label="CTR" value={14} total={100} color="bg-amber-600" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <StatCard title="Conversion" value="3.2%" />
                <StatCard title="Avg. Price" value="$792" />
              </div>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Sold PCs</h2>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-600">
                    <tr>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Model</th>
                      <th className="px-3 py-2">Buyer</th>
                      <th className="px-3 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSold.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2">{row.model}</td>
                        <td className="px-3 py-2">{row.buyer}</td>
                        <td className="px-3 py-2 text-right">${row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other Shops removed - seller-focused UI only */}
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button className="rounded-md border px-4 py-2 text-sm font-medium">
            Save Draft
          </button>
          <button
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={!publishReady}
          >
            Publish Listing
          </button>
        </div>
      </main>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="truncate text-sm font-medium" title={value}>
        {value}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-600">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function formatScanTime(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${dd}/${mm}/${yyyy}, ${hh}:${mi}:${ss} UTC`;
}
