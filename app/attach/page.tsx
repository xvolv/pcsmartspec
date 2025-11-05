"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import {
  useRouter,
  useSearchParams,
  ReadonlyURLSearchParams,
} from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Camera, CheckCircle2, XCircle } from "lucide-react";
import CameraCapture from "../com/CameraCapture";
import { Toaster, toast } from "react-hot-toast";
import { isAuthenticated } from "@/lib/auth/utils";

interface StorageItem {
  Model: string;
  Size_GB: number;
  Type: string;
  BusType: string;
}

interface PcSpec {
  id?: string;
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
}

//

// Add this interface at the top with other interfaces
interface FormData {
  brand: string;
  model: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
  display: string;
  cores?: string;
  threads?: string;
  baseSpeedMHz?: string;
  os?: string;
  condition: string;
  price: string;
  description: string;
}

function AttachListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams() as ReadonlyURLSearchParams;
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    scanId?: string;
    loadedAt?: string;
    data?: any;
  }>({});

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }
    setAuthChecking(false);
  }, [router]);

  const [formData, setFormData] = useState<FormData>({
    brand: "",
    model: "",
    cpu: "",
    ram: "",
    gpu: "",
    storage: "",
    display: "",
    condition: "New",
    price: "",
    description: "",
  });

  const [scannerData, setScannerData] = useState<PcSpec | null>(null);
  const [waitingForScan, setWaitingForScan] = useState<boolean>(false);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [editSpecs, setEditSpecs] = useState<boolean>(false);
  const [editableStorage, setEditableStorage] = useState<StorageItem[]>([]);

  // Check for scanner data on component mount
  useEffect(() => {
    const fetchScannerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if we have scanner data in the URL
        const params = new URLSearchParams(window.location.search);
        // Accept multiple param names from external tools
        const scanId =
          params.get("scanId") || params.get("pc_id") || params.get("id");

        setDebugInfo((prev) => ({
          ...prev,
          scanId: scanId || "none",
          loadedAt: new Date().toISOString(),
        }));

        if (scanId) {
          // Add a timestamp to prevent caching issues
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/scan/${scanId}?t=${timestamp}`, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            // Surface 404 specifically so outer catch can handle it
            if (response.status === 404) {
              throw new Error("404: Scan not found");
            }
            throw new Error(
              `Failed to fetch scan data: ${response.status} ${response.statusText}`
            );
          }

          const responseData = await response.json();

          // The actual scan data is in the 'data' property of the response
          const scanData = responseData.data || responseData;

          setScannerData(scanData);
          setWaitingForScan(false);

          // Initialize editable storage from scan data
          const initialStorage = (scanData.Storage || []).map((s: StorageItem) => ({
            Model: s.Model || "",
            Size_GB: s.Size_GB || 0,
            Type: s.Type || "",
            BusType: s.BusType || "",
          }));
          setEditableStorage(initialStorage);

          // Format storage information
          const storageInfo = (scanData.Storage || [])
            .map((s: StorageItem) => `${s.Size_GB}GB ${s.Type} ${s.BusType}`)
            .join(" + ");

          // Update form with scanner data
          const newFormData = {
            brand: scanData.Brand || "",
            model: scanData.Model || "",
            cpu: scanData.CPU || "",
            ram: scanData.RAM_GB
              ? `${scanData.RAM_GB}GB ${scanData.RAM_Type || ""} ${scanData.RAM_Speed_MHz || ""
              }MHz`
              : "",
            gpu: scanData.GPU || "",
            storage: storageInfo,
            display: scanData.Display_Resolution
              ? `${scanData.Display_Resolution} (${scanData.Screen_Size_inch || ""
              }")`
              : "",
            cores: scanData.Cores || "",
            threads: scanData.Threads || "",
            baseSpeedMHz: scanData.BaseSpeed_MHz || "",
            os: scanData.OS || "",
            condition: "New",
            price: "",
            description: "",
          };

          setFormData(newFormData);
          // Auto-fill listing title from scanned data
          setTitle(
            [scanData.Brand, scanData.Model].filter(Boolean).join(" ").trim()
          );

          setDebugInfo((prev) => ({
            ...prev,
            data: {
              ...scanData,
              Storage: scanData.Storage.map((s: StorageItem) => ({
                ...s,
                Size_GB: `${s.Size_GB}GB`,
              })),
            },
          }));
        } else {
          // Try to get the latest available scan for cross-device flow
          const timestamp = new Date().getTime();
          const latestResp = await fetch(`/api/scan/latest?t=${timestamp}`, {
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          });
          if (latestResp.ok) {
            const latestData = await latestResp.json();
            const scanData = latestData.data || latestData;

            setScannerData(scanData);
            setWaitingForScan(false);

            // Initialize editable storage from latest scan data
            const initialStorage = (scanData.Storage || []).map((s: StorageItem) => ({
              Model: s.Model || "",
              Size_GB: s.Size_GB || 0,
              Type: s.Type || "",
              BusType: s.BusType || "",
            }));
            setEditableStorage(initialStorage);

            const storageInfo = (scanData.Storage || [])
              .map((s: StorageItem) => `${s.Size_GB}GB ${s.Type} ${s.BusType}`)
              .join(" + ");

            const newFormData = {
              brand: scanData.Brand || "",
              model: scanData.Model || "",
              cpu: scanData.CPU || "",
              ram: scanData.RAM_GB
                ? `${scanData.RAM_GB}GB ${scanData.RAM_Type || ""} ${scanData.RAM_Speed_MHz || ""
                }MHz`
                : "",
              gpu: scanData.GPU || "",
              storage: storageInfo,
              display: scanData.Display_Resolution
                ? `${scanData.Display_Resolution} (${scanData.Screen_Size_inch || ""
                }")`
                : "",
              cores: scanData.Cores || "",
              threads: scanData.Threads || "",
              baseSpeedMHz: scanData.BaseSpeed_MHz || "",
              os: scanData.OS || "",
              condition: "New",
              price: "",
              description: "",
            };
            setFormData(newFormData);
            // Auto-fill listing title from latest scan
            setTitle(
              [scanData.Brand, scanData.Model].filter(Boolean).join(" ").trim()
            );
          } else {
            setWaitingForScan(true);
            setScannerData(null);
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        if (typeof errorMessage === "string" && errorMessage.includes("404")) {
          // Treat 404 as "waiting for a new scan" instead of an error
          setError(null);
          setWaitingForScan(true);
          setScannerData(null);
          setFormData({
            brand: "",
            model: "",
            cpu: "",
            ram: "",
            gpu: "",
            storage: "",
            display: "",
            condition: "New",
            price: "",
            description: "",
          });
          setTitle("");
        } else {
          // Other errors: show error message, do not populate mock data
          setScannerData(null);
          setWaitingForScan(false);
          setError(`Failed to load scanner data: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      fetchScannerData();
    }
  }, [searchParams, refreshTick]);

  useEffect(() => {
    if (!waitingForScan) return;
    const id = setInterval(() => setRefreshTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, [waitingForScan]);

  function SpecItem({
    label,
    value,
  }: {
    label: string;
    value: string | number | undefined;
  }) {
    return (
      <div className="rounded-lg border bg-white p-3">
        <div className="text-xs text-zinc-500">{label}</div>
        <div
          className="text-sm font-medium truncate sm:whitespace-normal sm:overflow-visible sm:text-clip"
          title={value?.toString()}
        >
          {value}
        </div>
      </div>
    );
  }
  const [images, setImages] = useState<string[]>([]);
  const [guaranteeMonths, setGuaranteeMonths] = useState<number>(1);
  const [guaranteeProvider, setGuaranteeProvider] =
    useState<string>("Royal computers");
  const [title, setTitle] = useState<string>("");
  const [price, setPrice] = useState<number | string>("00000");
  const INITIAL_PRICE = "00000";
  const [negotiable, setNegotiable] = useState<boolean>(false);
  const [condition, setCondition] = useState<string>("New");
  const [specialFeatures, setSpecialFeatures] = useState<string[]>([]);
  const [specialInput, setSpecialInput] = useState<string>("");
  const [batteryRange, setBatteryRange] = useState<string>("4-5");
  const [batteryOther, setBatteryOther] = useState<string>("");
  const [attached, setAttached] = useState<boolean>(false);
  const [attachedCount, setAttachedCount] = useState<number>(0);
  const [publishing, setPublishing] = useState<boolean>(false);
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
    () => {
      const storage = editableStorage.length > 0 ? editableStorage : (scannerData?.Storage || []);
      return storage.reduce(
        (sum, s) => sum + Number(s.Size_GB || 0),
        0
      );
    },
    [scannerData, editableStorage]
  );
  const ramSummary = useMemo(
    () =>
      scannerData?.RAM_GB
        ? `${scannerData.RAM_GB}GB ${scannerData.RAM_Type || ""} ${scannerData.RAM_Speed_MHz || ""
          }MHz`.trim()
        : "N/A",
    [scannerData]
  );
  const storageKinds = useMemo(() => {
    const storage = editableStorage.length > 0 ? editableStorage : (scannerData?.Storage || []);
    const kinds = Array.from(
      new Set(
        storage.map((s) =>
          [s.Type, s.BusType].filter(Boolean).join(" ")
        )
      )
    );
    return kinds.filter(Boolean).join(", ");
  }, [scannerData, editableStorage]);

  function onSelectImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, 4 - images.length);
    const toRead = files.slice(0, remaining);
    toRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setImages((prev) => {
          if (prev.length >= 4) return prev;
          return [...prev, String(reader.result)];
        });
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

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function onAttach() {
    if (!images.length) {
      toast.error("Please upload at least one image before attaching.", {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
      });
      return;
    }
    
    // Check if price is still the initial value
    const priceValue = typeof price === "string" ? price : String(price);
    if (priceValue === INITIAL_PRICE || priceValue === "0" || priceValue === "" || Number(priceValue) === 0) {
      toast.error("Please change the price from the initial value before attaching the listing.", {
        icon: <XCircle className="w-5 h-5 text-red-600" />,
      });
      return;
    }
    
    setAttached(true);
    setAttachedCount(images.length);
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading scanner data
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="-ml-0.5 mr-1.5 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className=" text-zinc-900">
      <Navbar />
      <div className="mb-6 flex flex-col justify-center items-center m-6 gap-2">
        <h1 className=" text-2xl font-semibold font-mono text-gray-900">
          Attach Listing
        </h1>
      </div>
      {waitingForScan && (
        <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 mt-0.5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zm-8-5a1 1 0 00-1 1v3.382l-1.724 1.724a1 1 0 101.414 1.414l2-2A1 1 0 0010 10V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <div className="text-sm font-medium">Waiting for a PC scan…</div>
              <div className="mt-1 text-sm">
                Once a new PC is scanned and uploaded, this page will populate
                automatically. You can also retry manually.
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    setIsLoading(true);
                    setRefreshTick((t) => t + 1);
                  }}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Retry Fetch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 lg:col-span-2 xl:col-span-2">
            <div className="text-sm text-zinc-500">Model</div>
            <div className="text-lg font-semibold truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">
              {scannerData?.Model || (waitingForScan ? "Waiting…" : "N/A")}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">CPU / RAM</div>
            <div className="text-lg font-semibold">
              {scannerData?.CPU?.split(" ")[0] ||
                (waitingForScan ? "Waiting…" : "N/A")}{" "}
              · {scannerData ? ramSummary : waitingForScan ? "Waiting…" : "N/A"}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">Storage Total</div>
            <div className="text-lg font-semibold">
              {totalStorageGB
                ? `${totalStorageGB.toFixed(0)} GB`
                : waitingForScan
                  ? "Waiting…"
                  : "N/A"}
              {storageKinds ? ` · ${storageKinds}` : ""}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-500">Scan Time</div>
            <div className="text-lg font-semibold">
              {scannerData?.Scan_Time
                ? formatScanTime(scannerData.Scan_Time)
                : waitingForScan
                  ? "Waiting…"
                  : "N/A"}
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

                <div className="space-y-2 relative">
                  <label className="block text-sm text-zinc-600">
                    Price (ETB)
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPrice(val === "" ? "" : Number(val));
                      }}
                      className={`w-full rounded-md border p-2 text-sm pr-20 transition-all duration-200 ${negotiable ? "border-green-400" : "border-zinc-300"
                        }`}
                    />

                    {/* Clickable negotiable tag */}
                    <button
                      type="button"
                      onClick={() => setNegotiable(!negotiable)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold transition-all duration-300 ${negotiable
                        ? "bg-green-100 text-green-800 border-green-300 shadow-sm"
                        : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                        }`}
                    >
                      <span>{negotiable ? "Negotiable" : "Fixed"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-zinc-600">
                    Condition
                  </label>
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
                  <label className="block text-sm text-zinc-600">
                    Battery Life Expectancy
                  </label>
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
                  <label className="block text-sm text-zinc-600">
                    Special Features
                  </label>
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
                        <span
                          key={f}
                          className="inline-flex items-center gap-2 rounded-full border bg-zinc-50 px-3 py-1 text-xs"
                        >
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
                    <div className="mb-2 text-xs text-zinc-500">
                      Suggestions
                    </div>
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
              <p className="mt-3 text-xs text-zinc-500">
                UI-only; no backend calls.
              </p>
            </div>

            {scannerData && (
              <div className="rounded-xl border bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold">Spec Preview</h2>
                  <button
                    type="button"
                    onClick={() => setEditSpecs((v) => !v)}
                    className="rounded-md border px-3 py-1 text-xs font-medium"
                  >
                    {editSpecs ? "Done" : "Edit Specs"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {editSpecs ? (
                    <>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">Brand</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.brand}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              brand: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">Model</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.model}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              model: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">CPU</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.cpu}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, cpu: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">Cores</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.cores || ""}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              cores: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">Threads</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.threads || ""}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              threads: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">
                          Base Speed (MHz)
                        </div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.baseSpeedMHz || ""}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              baseSpeedMHz: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">RAM</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.ram}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, ram: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">GPU</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.gpu}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, gpu: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">Display</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.display}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              display: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500">OS</div>
                        <input
                          className="w-full rounded-md border p-2 text-sm"
                          value={formData.os || ""}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, os: e.target.value }))
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <SpecItem
                        label="Brand"
                        value={formData.brand || scannerData.Brand}
                      />
                      <SpecItem
                        label="Model"
                        value={formData.model || scannerData.Model}
                      />
                      <SpecItem
                        label="CPU"
                        value={formData.cpu || scannerData.CPU}
                      />
                      <SpecItem
                        label="Cores / Threads"
                        value={`${formData.cores || scannerData.Cores} / ${formData.threads || scannerData.Threads
                          }`}
                      />
                      <SpecItem
                        label="Base Speed"
                        value={`${formData.baseSpeedMHz || scannerData.BaseSpeed_MHz
                          } MHz`}
                      />
                      <SpecItem
                        label="RAM"
                        value={
                          formData.ram ||
                          `${scannerData.RAM_GB} GB ${scannerData.RAM_Type} @ ${scannerData.RAM_Speed_MHz} MHz`
                        }
                      />
                      <SpecItem
                        label="GPU"
                        value={formData.gpu || scannerData.GPU}
                      />
                      <SpecItem
                        label="Display"
                        value={
                          formData.display ||
                          `${scannerData.Display_Resolution} · ${scannerData.Screen_Size_inch}\"`
                        }
                      />
                      <SpecItem
                        label="OS"
                        value={formData.os || scannerData.OS}
                      />
                    </>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-sm font-medium">Storage</div>
                  {editSpecs ? (
                    <div className="mt-2 space-y-2">
                      {(editableStorage.length > 0 ? editableStorage : scannerData?.Storage || []).map((s, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-1 gap-2 rounded-md border bg-white p-3 sm:grid-cols-4"
                        >
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              placeholder="Model (e.g., Samsung SSD 970)"
                              value={s.Model || ""}
                              onChange={(e) => {
                                const updated = [...editableStorage];
                                updated[i] = { ...updated[i], Model: e.target.value };
                                setEditableStorage(updated);
                              }}
                              className="w-full rounded-md border p-2 text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Type (e.g., SSD)"
                              value={s.Type || ""}
                              onChange={(e) => {
                                const updated = [...editableStorage];
                                updated[i] = { ...updated[i], Type: e.target.value };
                                setEditableStorage(updated);
                              }}
                              className="w-full rounded-md border p-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Size GB"
                              value={s.Size_GB || ""}
                              onChange={(e) => {
                                const updated = [...editableStorage];
                                updated[i] = { ...updated[i], Size_GB: Number(e.target.value) || 0 };
                                setEditableStorage(updated);
                              }}
                              className="w-full rounded-md border p-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Bus (e.g., NVMe)"
                              value={s.BusType || ""}
                              onChange={(e) => {
                                const updated = [...editableStorage];
                                updated[i] = { ...updated[i], BusType: e.target.value };
                                setEditableStorage(updated);
                              }}
                              className="w-full rounded-md border p-2 text-sm"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditableStorage([...editableStorage, { Model: "", Size_GB: 0, Type: "", BusType: "" }]);
                        }}
                        className="w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        + Add Storage Item
                      </button>
                      {editableStorage.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editableStorage.length > 1) {
                              setEditableStorage(editableStorage.slice(0, -1));
                            }
                          }}
                          className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          - Remove Last Item
                        </button>
                      )}
                    </div>
                  ) : (
                    <ul className="mt-2 divide-y rounded-md border bg-zinc-50">
                      {(editableStorage.length > 0 ? editableStorage : scannerData?.Storage || []).map((s, i) => (
                        <li
                          key={i}
                          className="grid grid-cols-4 gap-2 p-3 text-sm"
                        >
                          <div className="col-span-2 truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">
                            {s.Model || "N/A"}
                          </div>
                          <div>
                            {s.Type || "N/A"}/{s.BusType || "N/A"}
                          </div>
                          <div className="text-right">{s.Size_GB || 0} GB</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 text-base font-semibold">Photos</h2>

              <CameraCapture
                onCapture={(imageDataUrl) => {
                  if (images.length < 4) {
                    setImages((prev) => [...prev, imageDataUrl]);
                  }
                }}
                maxImages={4}
                currentImageCount={images.length}
              />

              <div className="mb-4 flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload from Device
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onSelectImages}
                    className="hidden"
                    disabled={images.length >= 4}
                  />
                </label>
                <button
                  onClick={onAttach}
                  className={`rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${attached ? "bg-emerald-600" : "bg-zinc-900"
                    }`}
                  disabled={!images.length}
                >
                  {attached
                    ? `Attached ${attachedCount} photo${attachedCount === 1 ? "" : "s"
                    }`
                    : "Attach to Listing"}
                </button>
              </div>

              <div className="mb-3 text-xs text-zinc-500">
                {images.length}/4 selected
              </div>

              {attached && (
                <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Photos attached to the draft listing. You can still remove or
                  add before publishing.
                </div>
              )}

              {!!images.length && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {images.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative overflow-hidden rounded-lg border bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-[2px] text-xs font-semibold text-white shadow hover:bg-red-700"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        ×
                      </button>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
            </div>

          </section>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={publishing || !scannerData?.id || images.length === 0}
            onClick={async () => {
              try {
                // Validate images before publishing
                if (!images || images.length === 0) {
                  toast.error("Please upload at least one image before publishing.", {
                    icon: <XCircle className="w-5 h-5 text-red-600" />,
                  });
                  return;
                }

                // Validate price has been changed from initial value
                const priceValue = typeof price === "string" ? price : String(price);
                if (priceValue === INITIAL_PRICE || priceValue === "0" || priceValue === "" || Number(priceValue) === 0) {
                  toast.error("Please change the price from the initial value before publishing the listing.", {
                    icon: <XCircle className="w-5 h-5 text-red-600" />,
                  });
                  return;
                }

                setPublishing(true);

                // Parse RAM from formData
                const parseRAM = (ramStr: string) => {
                  const ramMatch = ramStr.match(/(\d+)GB\s*(.*?)\s*(\d+)MHz/);
                  if (ramMatch) {
                    return {
                      ram_gb: ramMatch[1],
                      ram_type: ramMatch[2].trim(),
                      ram_speed_mhz: ramMatch[3],
                    };
                  }
                  // Fallback to scanner data if parsing fails
                  return {
                    ram_gb: scannerData?.RAM_GB || null,
                    ram_type: scannerData?.RAM_Type || null,
                    ram_speed_mhz: scannerData?.RAM_Speed_MHz || null,
                  };
                };

                // Parse Display from formData
                const parseDisplay = (displayStr: string) => {
                  const displayMatch = displayStr.match(/(.*?)\s*\((\d+(?:\.\d+)?)"/);
                  if (displayMatch) {
                    return {
                      display_resolution: displayMatch[1].trim(),
                      screen_size_inch: parseFloat(displayMatch[2]),
                    };
                  }
                  // Fallback to scanner data if parsing fails
                  return {
                    display_resolution: scannerData?.Display_Resolution || null,
                    screen_size_inch: scannerData?.Screen_Size_inch || null,
                  };
                };

                const ramData = parseRAM(formData.ram || "");
                const displayData = parseDisplay(formData.display || "");

                // Use editableStorage if it has been edited, otherwise use scannerData.Storage
                // Check if editableStorage was initialized and has items
                const storageToSend = editableStorage.length > 0
                  ? editableStorage.filter(s => s.Size_GB > 0 || s.Model || s.Type || s.BusType) // Filter out empty items
                  : (scannerData?.Storage || []);

                const res = await fetch("/api/listings/publish", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: scannerData?.id,
                    title,
                    price,
                    // Send formData overrides
                    formData: {
                      brand: formData.brand || undefined,
                      model: formData.model || undefined,
                      cpu: formData.cpu || undefined,
                      ram_gb: ramData.ram_gb || undefined,
                      ram_type: ramData.ram_type || undefined,
                      ram_speed_mhz: ramData.ram_speed_mhz || undefined,
                      cores: formData.cores || undefined,
                      threads: formData.threads || undefined,
                      base_speed_mhz: formData.baseSpeedMHz || undefined,
                      gpu: formData.gpu || undefined,
                      display_resolution: displayData.display_resolution || undefined,
                      screen_size_inch: displayData.screen_size_inch || undefined,
                      os: formData.os || undefined,
                      storage: storageToSend,
                    },
                    extras: {
                      condition,
                      negotiable,
                      // send null when user cleared the input instead of empty string
                      guaranteeMonths: typeof guaranteeMonths === "number" && Number.isFinite(guaranteeMonths) ? guaranteeMonths : null,
                      guaranteeProvider,
                      battery: batteryRange === "Other" ? batteryOther : batteryRange,
                      specialFeatures,
                    },
                    images,
                  }),
                });
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({ error: `Failed to publish: ${res.status}` }));
                  const errorMessage = errorData?.error || `Failed to publish: ${res.status}`;

                  // User-friendly error messages
                  if (errorMessage.includes('images') && errorMessage.includes('null')) {
                    throw new Error("Please upload at least one image before publishing.");
                  } else if (errorMessage.includes('Please upload at least one image')) {
                    throw new Error(errorMessage);
                  } else {
                    throw new Error(errorMessage);
                  }
                }
                const data = await res.json();
                toast.success("Listing published successfully.", {
                  icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
                });

                // Reset page to waiting mode after successful publish        
                setScannerData(null);
                setWaitingForScan(true);
                setEditableStorage([]);
                setFormData({
                  brand: "",
                  model: "",
                  cpu: "",
                  ram: "",
                  gpu: "",
                  storage: "",
                  display: "",
                  condition: "New",
                  price: "",
                  description: "",
                });
                setTitle("");
                setImages([]);
                setAttached(false);
                setAttachedCount(0);
                setSpecialFeatures([]);
                setSpecialInput("");
                setBatteryRange("4-5");
                setBatteryOther("");
                setCondition("New");
                setPrice("00000");
                setNegotiable(false);

                // Trigger refresh to check for new scan data
                setTimeout(() => {
                  setRefreshTick((t) => t + 1);
                }, 1000);
              } catch (e: any) {
                toast.error(e?.message || "Failed to publish listing", {
                  icon: <XCircle className="w-5 h-5 text-red-600" />,
                });
              } finally {
                setPublishing(false);
              }
            }}
          >
            {publishing ? "Publishing…" : "Publish Listing"}
          </button>
        </div>
      </main>
      <Footer />
      <Toaster position="top-center" />
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
  try {
    if (!dateStr) {
      return "N/A";
    }

    // Create date object
    const date = new Date(dateStr);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    // Format time in Ethiopian timezone (Africa/Addis_Ababa)
    const etTime = date.toLocaleTimeString("en-ET", {
      timeZone: "Africa/Addis_Ababa",
      hour12: true,
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    // Format date in Ethiopian timezone
    const etDate = date.toLocaleDateString("en-ET", {
      timeZone: "Africa/Addis_Ababa",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const formattedDate = `${etDate}, ${etTime} (EAT)`;

    return formattedDate;
  } catch (error) {
    return "Error formatting date";
  }
}

export default function AttachListing() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AttachListingContent />
    </Suspense>
  );
}
