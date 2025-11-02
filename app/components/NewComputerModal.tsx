"use client";

import { useState, type ChangeEvent } from "react";

type SpecsState = {
  brand: string;
  ram: string;
  storageType: string;
  storageSize: string;
  processor: string;
};

export type NewComputerData = {
  name: string;
  price: number;
  negotiable: boolean;
  specs: string;
  images: string[];
};

export default function NewComputerModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (data: NewComputerData) => void;
}) {
  const [uPrice, setUPrice] = useState<string | number>("");
  const [uNegotiable, setUNegotiable] = useState(true);
  const [uSpecs, setUSpecs] = useState<SpecsState>({
    brand: "",
    ram: "",
    storageType: "",
    storageSize: "",
    processor: "",
  });
  const [uImages, setUImages] = useState<string[]>([]);
  const [model, setModel] = useState<string>("");
  const [additionalSpecs, setAdditionalSpecs] = useState<string>("");
  const [series, setSeries] = useState<string>("");
  const [condition, setCondition] = useState<string>("");

  // Quick gaming spec (compact fields)
  const [gCpu, setGCpu] = useState<string>(""); // e.g., Intel core Ultra 9 (i9-14900HX)
  const [gCores, setGCores] = useState<string>(""); // e.g., 24
  const [gThreads, setGThreads] = useState<string>(""); // e.g., 32
  const [gBoost, setGBoost] = useState<string>(""); // e.g., 5.4
  const [gStorage, setGStorage] = useState<string>(""); // e.g., 1TB SSD
  const [gRamAmount, setGRamAmount] = useState<string>(""); // e.g., 16GB
  const [gRamType, setGRamType] = useState<string>(""); // e.g., DDR6 / DDR5
  const [gRamSpeed, setGRamSpeed] = useState<string>(""); // e.g., 6400
  const [gScreenSize, setGScreenSize] = useState<string>(""); // e.g., 16
  const [gResolution, setGResolution] = useState<string>(""); // e.g., WUXGA 2K
  const [gRefresh, setGRefresh] = useState<string>(""); // e.g., 240
  const [gBattery, setGBattery] = useState<string>("");
  const [gGpu, setGGpu] = useState<string>(""); // e.g., NVIDIA GeForce RTX 5070 8GB

  // CPU
  const [cpuBrand, setCpuBrand] = useState<string>("");
  const [cpuSeries, setCpuSeries] = useState<string>("");
  const [cpuGeneration, setCpuGeneration] = useState<string>("");
  const [cpuModel, setCpuModel] = useState<string>("");

  // RAM & Storage
  const [ramType, setRamType] = useState<string>("");
  const [ramCapacity, setRamCapacity] = useState<string>("");
  const [storageTypeMain, setStorageTypeMain] = useState<string>("");
  const [storageSubtype, setStorageSubtype] = useState<string>("");
  const [storageCapacity, setStorageCapacity] = useState<string>("");

  // Display
  const [screenSize, setScreenSize] = useState<string>("");
  const [resolution, setResolution] = useState<string>("");
  const [refreshRate, setRefreshRate] = useState<string>("");

  // GPU
  const [gpuType, setGpuType] = useState<string>("");
  const [gpuBrand, setGpuBrand] = useState<string>("");
  const [gpuSeries, setGpuSeries] = useState<string>("");
  const [gpuModel, setGpuModel] = useState<string>("");

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const limited = Array.from(files).slice(0, 5);
    const previews: string[] = await Promise.all(
      limited.map(
        (f) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(f);
          })
      )
    );
    setUImages(previews);
  };

  const buildSpecsString = (s: SpecsState) => {
    const cpuSummary = [cpuBrand, cpuSeries, cpuGeneration, cpuModel]
      .filter(Boolean)
      .join(" ");
    const memSummary = [
      ramType && `RAM Type: ${ramType}`,
      ramCapacity && `RAM: ${ramCapacity}`,
    ]
      .filter(Boolean)
      .join(" | ");
    const storageSummary = [
      storageTypeMain && `Storage: ${storageTypeMain}`,
      storageSubtype && `Sub-type: ${storageSubtype}`,
      storageCapacity && `Capacity: ${storageCapacity}`,
    ]
      .filter(Boolean)
      .join(" | ");
    const displaySummary = [
      screenSize && `Screen: ${screenSize}`,
      resolution && `Resolution: ${resolution}`,
      refreshRate && `Refresh: ${refreshRate}`,
    ]
      .filter(Boolean)
      .join(" | ");
    const gpuSummary = [gpuType, gpuBrand, gpuSeries, gpuModel]
      .filter(Boolean)
      .join(" ");

    return [
      s.brand &&
        `Brand: ${s.brand}${
          series ? ` (${series}${model ? ` ${model}` : ""})` : ""
        }`,
      condition && `Condition: ${condition}`,
      cpuSummary && `CPU: ${cpuSummary}`,
      memSummary,
      storageSummary,
      displaySummary,
      gpuSummary && `GPU: ${gpuSummary}`,
      s.ram && `Legacy RAM: ${s.ram}`,
      s.storageType && `Legacy Storage Type: ${s.storageType}`,
      s.storageSize && `Legacy Storage Size: ${s.storageSize}`,
      s.processor && `Legacy Processor: ${s.processor}`,
      warranty && `Warranty: ${warranty}`,
      additionalSpecs && additionalSpecs,
    ]
      .filter(Boolean)
      .join(" | ");
  };

  const addAndClose = () => {
    if (!uSpecs.brand) return;
    const specsString = buildSpecsString(uSpecs);
    const computedName = [uSpecs.brand, series, model]
      .filter(Boolean)
      .join(" ");
    onAdd({
      name: computedName,
      price: Number(uPrice || 0),
      negotiable: uNegotiable,
      specs: specsString,
      images: uImages,
    });
    setUPrice("");
    setUNegotiable(true);
    setUSpecs({
      brand: "",
      ram: "",
      storageType: "",
      storageSize: "",
      processor: "",
    });
    setUImages([]);
    setModel("");
    setSeries("");
    setCondition("");
    setCpuBrand("");
    setCpuSeries("");
    setCpuGeneration("");
    setCpuModel("");
    setRamType("");
    setRamCapacity("");
    setStorageTypeMain("");
    setStorageSubtype("");
    setStorageCapacity("");
    setScreenSize("");
    setResolution("");
    setRefreshRate("");
    setGpuType("");
    setGpuBrand("");
    setGpuSeries("");
    setGpuModel("");
    setAdditionalSpecs("");
    onClose();
  };

  // Mappings
  const seriesByBrand: Record<string, string[]> = {
    Dell: ["XPS", "Latitude", "Inspiron", "Vostro", "Alienware"],
    HP: ["Pavilion", "EliteBook", "ProBook", "Omen", "Spectre"],
    Lenovo: ["ThinkPad", "IdeaPad", "Legion", "Yoga"],
    Apple: ["MacBook Air", "MacBook Pro", "iMac"],
    Asus: ["ZenBook", "VivoBook", "ROG", "TUF"],
  };

  const modelsBySeries: Record<string, string[]> = {
    XPS: ["13", "15", "17"],
    Latitude: ["5000", "7000"],
    Inspiron: ["3000", "5000", "7000"],
    Vostro: ["3000", "5000"],
    Alienware: ["m15", "x16"],
    Pavilion: ["15", "Gaming 15"],
    EliteBook: ["840", "850"],
    ProBook: ["450", "455"],
    Omen: ["16", "Transcend 14"],
    Spectre: ["x360 13", "x360 14", "x360 16"],
    ThinkPad: ["T14", "X1 Carbon", "P1"],
    IdeaPad: ["3", "5", "Gaming 3"],
    Legion: ["5", "7"],
    Yoga: ["7", "9"],
    "MacBook Air": ["M1", "M2", "M3"],
    "MacBook Pro": ["M1 Pro", "M2 Pro", "M3 Pro"],
    iMac: ['24" M1', '24" M3'],
    ZenBook: ["14", "Pro 16X"],
    VivoBook: ["15", "S 14"],
    ROG: ["Zephyrus G14", "Strix G16"],
    TUF: ["A15", "F15"],
  };

  const cpuSeriesByBrand: Record<string, string[]> = {
    Intel: ["Core i3", "Core i5", "Core i7", "Core i9"],
    AMD: ["Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9"],
  };

  const cpuGenBySeries: Record<string, string[]> = {
    "Core i3": ["10th", "11th", "12th", "13th", "14th"],
    "Core i5": ["10th", "11th", "12th", "13th", "14th"],
    "Core i7": ["10th", "11th", "12th", "13th", "14th"],
    "Core i9": ["10th", "11th", "12th", "13th", "14th"],
    "Ryzen 3": ["3000", "4000", "5000", "7000"],
    "Ryzen 5": ["3000", "4000", "5000", "7000"],
    "Ryzen 7": ["3000", "4000", "5000", "7000"],
    "Ryzen 9": ["3000", "4000", "5000", "7000"],
  };

  const cpuModelsByGen: Record<string, string[]> = {
    "10th": ["10110U", "10400H"],
    "11th": ["1135G7", "11800H"],
    "12th": ["1235U", "12700H"],
    "13th": ["13420H", "13700H"],
    "14th": ["14650HX", "14900HX"],
    "3000": ["3500U"],
    "4000": ["4500U", "4800H"],
    "5000": ["5500U", "5800H"],
    "7000": ["7530U", "7840HS"],
  };

  const ramCapByType: Record<string, string[]> = {
    DDR4: ["4GB", "8GB", "16GB", "32GB"],
    DDR5: ["8GB", "16GB", "24GB", "32GB", "64GB"],
    LPDDR4: ["4GB", "8GB", "16GB"],
    LPDDR5: ["8GB", "16GB", "32GB"],
  };

  const storageSubtypeByType: Record<string, string[]> = {
    ssd: ["SATA", "NVMe"],
    hdd: ["5400rpm", "7200rpm"],
    hybrid: ["SSHD"],
  };

  const storageCapBySubtype: Record<string, string[]> = {
    SATA: ["128GB", "256GB", "512GB", "1TB", "2TB"],
    NVMe: ["256GB", "512GB", "1TB", "2TB"],
    "5400rpm": ["500GB", "1TB", "2TB"],
    "7200rpm": ["1TB", "2TB"],
    SSHD: ["1TB", "2TB"],
  };

  const gpuBrandByType: Record<string, string[]> = {
    Integrated: ["Intel", "AMD"],
    Dedicated: ["NVIDIA", "AMD"],
  };

  const gpuSeriesByBrand: Record<string, string[]> = {
    Intel: ["Iris Xe", "UHD"],
    AMD: ["Radeon Vega", "Radeon RX"],
    NVIDIA: ["GTX 16", "RTX 20", "RTX 30", "RTX 40"],
  };

  const gpuModelsBySeries: Record<string, string[]> = {
    "Iris Xe": ["G7"],
    UHD: ["620"],
    "Radeon Vega": ["8", "10"],
    "Radeon RX": ["6600M", "7600S"],
    "GTX 16": ["1650", "1660 Ti"],
    "RTX 20": ["2060", "2070", "2080"],
    "RTX 30": ["3050", "3060", "3070", "3080"],
    "RTX 40": ["4050", "4060", "4070", "4080", "4090"],
  };

  const warrantyOptions = [
    "No Warranty",
    "1 Month",
    "3 Months",
    "6 Months",
    "1 Year",
    "2 Years",
    "3 Years",
  ];

  const [warranty, setWarranty] = useState<string>("");

  async function handleGeneratePost() {
    const title = [uSpecs.brand, series, model].filter(Boolean).join(" ");
    let post: string;
    const parts = [
      `Condition: ${condition || "—"}`,
      cpuBrand &&
        `CPU: ${[cpuBrand, cpuSeries, cpuGeneration, cpuModel]
          .filter(Boolean)
          .join(" ")}`,
      (ramType || ramCapacity) &&
        `Memory: ${[ramType, ramCapacity].filter(Boolean).join(" ")}`,
      (storageTypeMain || storageSubtype || storageCapacity) &&
        `Storage: ${[storageTypeMain, storageSubtype, storageCapacity]
          .filter(Boolean)
          .join(" ")}`,
      (screenSize || resolution || refreshRate) &&
        `Display: ${[screenSize, resolution, refreshRate]
          .filter(Boolean)
          .join(" • ")}`,
      (gpuType || gpuBrand || gpuSeries || gpuModel) &&
        `Graphics: ${[gpuType, gpuBrand, gpuSeries, gpuModel]
          .filter(Boolean)
          .join(" ")}`,
      warranty && `Warranty: ${warranty}`,
      additionalSpecs && `Notes: ${additionalSpecs}`,
      `Price: ${uPrice ? `${uPrice} Birr` : "—"}`,
    ].filter(Boolean);
    post = `📦 ${title || "Laptop"}\n\n${parts.join("\n")}`;
    try {
      await navigator.clipboard.writeText(post);
      alert("Post copied to clipboard");
    } catch {
      // fallback: no-op
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-fadeIn">
        <div className="mb-6 flex items-left justify-end  top-0 bg-white">
          <button
            className="  transition-colors duration-200 hover:cursor-pointer"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Price ($)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 appearance-none focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none appearance-none"
              value={uPrice}
              onChange={(e) => {
                const value = e.target.value;
                setUPrice(value === "" ? "" : Number(value));
              }}
            />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <input
              id="u-neg"
              type="checkbox"
              checked={uNegotiable}
              onChange={(e) => setUNegotiable(e.target.checked)}
              className="rounded border-slate-400 text-blue-600 focus:ring-blue-300"
            />
            <label
              htmlFor="u-neg"
              className="text-sm font-medium text-slate-700"
            >
              <i className="fa-regular fa-handshake mr-2" />
              Price is negotiable
            </label>
          </div>
          {/* Brand (mandatory) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Brand</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
              value={uSpecs.brand}
              onChange={(e) => {
                setUSpecs((prev) => ({ ...prev, brand: e.target.value }));
                setModel("");
              }}
            >
              <option value="">Select Brand</option>
              {["Dell", "HP", "Lenovo", "Apple", "Asus"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Model (depends on Brand) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Model</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!uSpecs.brand}
            >
              <option value="">Select Model</option>
              {(
                {
                  Dell: ["XPS", "Latitude", "Inspiron", "Vostro", "Alienware"],
                  HP: ["Pavilion", "EliteBook", "ProBook", "Omen", "Spectre"],
                  Lenovo: ["ThinkPad", "IdeaPad", "Legion", "Yoga"],
                  Apple: ["MacBook Air", "MacBook Pro", "iMac"],
                  Asus: ["ZenBook", "VivoBook", "ROG", "TUF"],
                } as Record<string, string[]>
              )[uSpecs.brand]
                ? (
                    {
                      Dell: [
                        "XPS",
                        "Latitude",
                        "Inspiron",
                        "Vostro",
                        "Alienware",
                      ],
                      HP: [
                        "Pavilion",
                        "EliteBook",
                        "ProBook",
                        "Omen",
                        "Spectre",
                      ],
                      Lenovo: ["ThinkPad", "IdeaPad", "Legion", "Yoga"],
                      Apple: ["MacBook Air", "MacBook Pro", "iMac"],
                      Asus: ["ZenBook", "VivoBook", "ROG", "TUF"],
                    } as Record<string, string[]>
                  )[uSpecs.brand].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                : null}
            </select>
          </div>

          {/* Condition */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Condition
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="">Select Condition</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Used">Used</option>
              <option value="Refurbished">Refurbished</option>
            </select>
          </div>

          {/* CPU Section */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              CPU
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Brand</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={cpuBrand}
                  onChange={(e) => {
                    setCpuBrand(e.target.value);
                    setCpuSeries("");
                    setCpuGeneration("");
                    setCpuModel("");
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(cpuSeriesByBrand).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Series</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={cpuSeries}
                  onChange={(e) => {
                    setCpuSeries(e.target.value);
                    setCpuGeneration("");
                    setCpuModel("");
                  }}
                  disabled={!cpuBrand}
                >
                  <option value="">Select</option>
                  {(cpuBrand ? cpuSeriesByBrand[cpuBrand] : []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Generation</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={cpuGeneration}
                  onChange={(e) => {
                    setCpuGeneration(e.target.value);
                    setCpuModel("");
                  }}
                  disabled={!cpuSeries}
                >
                  <option value="">Select</option>
                  {(cpuSeries ? cpuGenBySeries[cpuSeries] : []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Model</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={cpuModel}
                  onChange={(e) => setCpuModel(e.target.value)}
                  placeholder="e.g., 14900HX, 11800H, 7530U"
                  disabled={!cpuGeneration}
                />
              </div>
            </div>
          </div>

          {/* Memory Section */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Memory
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">RAM Type</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={ramType}
                  onChange={(e) => {
                    setRamType(e.target.value);
                    setRamCapacity("");
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(ramCapByType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Capacity</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={ramCapacity}
                  onChange={(e) => setRamCapacity(e.target.value)}
                  disabled={!ramType}
                >
                  <option value="">Select</option>
                  {(ramType ? ramCapByType[ramType] : []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Storage Section */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Storage
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Type</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={storageTypeMain}
                  onChange={(e) => {
                    setStorageTypeMain(e.target.value);
                    setStorageSubtype("");
                    setStorageCapacity("");
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(storageSubtypeByType).map((t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Sub-type</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={storageSubtype}
                  onChange={(e) => {
                    setStorageSubtype(e.target.value);
                    setStorageCapacity("");
                  }}
                  disabled={!storageTypeMain}
                >
                  <option value="">Select</option>
                  {(storageTypeMain
                    ? storageSubtypeByType[
                        storageTypeMain as keyof typeof storageSubtypeByType
                      ]
                    : []
                  ).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Capacity</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value)}
                  disabled={!storageSubtype}
                >
                  <option value="">Select</option>
                  {(storageSubtype
                    ? storageCapBySubtype[
                        storageSubtype as keyof typeof storageCapBySubtype
                      ]
                    : []
                  ).map((cap) => (
                    <option key={cap} value={cap}>
                      {cap}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Display Section */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Display
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Screen Size</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={screenSize}
                  onChange={(e) => setScreenSize(e.target.value)}
                  placeholder='e.g. 15.6"'
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Resolution</label>
                <input
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="e.g. 1920x1080"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Refresh Rate</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={refreshRate}
                  onChange={(e) => setRefreshRate(e.target.value)}
                >
                  <option value="">Select</option>
                  {["60Hz", "90Hz", "120Hz", "144Hz", "165Hz", "240Hz"].map(
                    (hz) => (
                      <option key={hz} value={hz}>
                        {hz}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* GPU Section */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Graphics
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Type</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={gpuType}
                  onChange={(e) => {
                    setGpuType(e.target.value);
                    setGpuBrand("");
                    setGpuSeries("");
                    setGpuModel("");
                  }}
                >
                  <option value="">Select</option>
                  {Object.keys(gpuBrandByType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Brand</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={gpuBrand}
                  onChange={(e) => {
                    setGpuBrand(e.target.value);
                    setGpuSeries("");
                    setGpuModel("");
                  }}
                  disabled={!gpuType}
                >
                  <option value="">Select</option>
                  {(gpuType ? gpuBrandByType[gpuType] : []).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Series</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={gpuSeries}
                  onChange={(e) => {
                    setGpuSeries(e.target.value);
                    setGpuModel("");
                  }}
                  disabled={!gpuBrand}
                >
                  <option value="">Select</option>
                  {(gpuBrand ? gpuSeriesByBrand[gpuBrand] : []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Model</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={gpuModel}
                  onChange={(e) => setGpuModel(e.target.value)}
                  disabled={!gpuSeries}
                >
                  <option value="">Select</option>
                  {(gpuSeries ? gpuModelsBySeries[gpuSeries] : []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Warranty */}
          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Warranty
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Warranty</label>
                <select
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                >
                  <option value="">Select</option>
                  {warrantyOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Other specs */}
          {[
            {
              label: "RAM",
              key: "ram",
              options: ["4GB", "8GB", "16GB", "32GB"],
            },
            {
              label: "Storage Type",
              key: "storageType",
              options: ["SSD", "HDD", "Hybrid"],
            },
            {
              label: "Storage Size",
              key: "storageSize",
              options: ["128GB", "256GB", "512GB", "1TB"],
            },
            {
              label: "Processor",
              key: "processor",
              options: ["Intel i5", "Intel i7", "AMD Ryzen 5", "M1/M2"],
            },
          ].map((spec: any) => (
            <div key={spec.key} className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {spec.label}
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none"
                value={(uSpecs as any)[spec.key]}
                onChange={(e) =>
                  setUSpecs((prev) => ({ ...prev, [spec.key]: e.target.value }))
                }
              >
                <option value="">Select {spec.label}</option>
                {spec.options.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Additional Specifications (optional) */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Additional Specifications (optional)
            </label>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none resize-none"
              value={additionalSpecs}
              onChange={(e) => setAdditionalSpecs(e.target.value)}
              placeholder="Any extra details..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">
              Images (max 5)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleImageUpload}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 transition-all duration-200"
            />
            {uImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {uImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative h-24 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 group"
                  >
                    <img
                      src={src}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                      <button
                        className="bg-green-500 p-2 rounded-full text-white"
                        title="Approve"
                      >
                        <i className="fa-solid fa-check" />
                      </button>
                      <button
                        className="bg-red-500 p-2 rounded-full text-white"
                        title="Remove"
                        onClick={() =>
                          setUImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-slate-700 font-medium hover:bg-slate-50 hover:scale-105 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl border border-blue-300 bg-white px-6 py-3 text-blue-700 font-medium hover:bg-blue-50 hover:scale-105 transition"
            onClick={handleGeneratePost}
          >
            🚀 Generate Post
          </button>
          <button
            className="rounded-xl bg-linear-to-r from-blue-500 to-purple-600 px-6 py-3 text-white font-medium hover:shadow-lg hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={addAndClose}
            disabled={!uSpecs.brand}
          >
            <i className="fa-solid fa-plus mr-2" />
            Add Device
          </button>
        </div>
      </div>
    </div>
  );
}
