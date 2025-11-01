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

export default function AttachListing() {
  const [images, setImages] = useState<string[]>([]);
  const [guaranteeMonths, setGuaranteeMonths] = useState<number>(12);
  const [guaranteeProvider, setGuaranteeProvider] =
    useState<string>("PCSmartSpec");
  const [publishReady, setPublishReady] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(
    `${sampleSpec.Brand} ${sampleSpec.Model}`
  );
  const [price, setPrice] = useState<number>(799);
  const [condition, setCondition] = useState<string>("New");
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([]);
  const [specialInput, setSpecialInput] = useState<string>("");
  const [batteryRange, setBatteryRange] = useState<string>("4-5");
  const [batteryOther, setBatteryOther] = useState<string>("");
  const suggestions = useMemo(
    () => [
      "Backlit Keyboard",
      "1080p 144Hz",
      "Windows 11 Home",
      "USB-C",
      "Wi‑Fi 6",
      "360 degree hinge",
      "RGB keyboard",
    ],
    []
  );
  const batteryOptions = useMemo(
    () => [
      "1-2",
      "2-3",
      "3-4",
      "4-5",
      "5-6",
      "6-7",
      "7-8",
      "8-9",
      "9-10",
      "Other",
    ],
    []
  );

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

  function onSelectImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImages((prev) => [...prev, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  }

  function addFeature(text: string) {
    const t = text.trim();
    if (!t) return;
    setSpecialFeatures((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setSpecialInput("");
  }

  function removeFeature(text: string) {
    setSpecialFeatures((prev) => prev.filter((f) => f !== text));
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
              <h1 className="text-lg font-semibold">Attach Listing</h1>
              <p className="text-xs text-zinc-500">Attach photos and set guarantee before publishing</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <a
              href="/admin"
              className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Dashboard
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

      <main className="mx-auto max-w-6xl px-6 py-8">
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

        <div className="mt-8 grid grid-cols-1 gap-6">
          <section className="space-y-6">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Listing Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">Price (USD)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-md border p-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm"
                  >
                    <option>New</option>
                    <option>Like New</option>
                    <option>Used</option>
                    <option>Refurbished</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">Battery Life Expectancy</label>
                  <select
                    value={batteryRange}
                    onChange={(e) => setBatteryRange(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm"
                  >
                    {batteryOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "Other" ? "Other" : `${opt} hours`}
                      </option>
                    ))}
                  </select>
                  {batteryRange === "Other" && (
                    <input
                      placeholder="e.g. BEST BATTERY LIFE"
                      value={batteryOther}
                      onChange={(e) => setBatteryOther(e.target.value)}
                      className="w-full rounded-md border p-2 text-sm"
                    />
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm text-zinc-600">Special Features</label>
                  <div className="flex gap-2">
                    <input
                      value={specialInput}
                      onChange={(e) => setSpecialInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature(specialInput);
                        }
                      }}
                      placeholder="Type a feature and press Enter"
                      className="w-full rounded-md border p-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => addFeature(specialInput)}
                      className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                    >
                      Add
                    </button>
                  </div>
                  {!!specialFeatures.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {specialFeatures.map((f) => (
                        <span key={f} className="inline-flex items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-xs">
                          {f}
                          <button
                            type="button"
                            onClick={() => removeFeature(f)}
                            className="rounded bg-zinc-200 px-1 text-[10px]"
                            aria-label={`Remove ${f}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <div className="mb-2 text-xs text-zinc-500">Suggestions</div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addFeature(s)}
                          className="rounded-full border bg-white px-3 py-1 text-xs hover:bg-zinc-50"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">UI-only; no backend calls.</p>
            </div>

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
      <div className="text-sm font-medium truncate sm:whitespace-normal sm:overflow-visible sm:text-clip" title={value}>
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
