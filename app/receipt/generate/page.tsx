"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

interface Listing {
  id: string;
  brand: string | null;
  model: string | null;
  cpu: string | null;
  ram_gb: string | null;
  ram_type: string | null;
  gpu: string | null;
  display_resolution: string | null;
  screen_size_inch: number | null;
  os: string | null;
  price: number | null;
  storage: any;
  images: string[] | null;
}

function GenerateReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellerSignature, setSellerSignature] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!listingId) {
      router.push("/dashboard");
      return;
    }

    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${listingId}`, { cache: "no-store" });
        const result = await res.json();

        if (!res.ok || result.status !== "ok") {
          router.push("/dashboard");
          return;
        }

        // Transform the API response to match our interface
        const listingData = result.data;
        setListing({
          id: listingData.id,
          brand: listingData.Brand || listingData.brand,
          model: listingData.Model || listingData.model,
          cpu: listingData.CPU || listingData.cpu,
          ram_gb: listingData.RAM_GB || listingData.ram_gb,
          ram_type: listingData.RAM_Type || listingData.ram_type,
          gpu: listingData.GPU || listingData.gpu,
          display_resolution: listingData.Display_Resolution || listingData.display_resolution,
          screen_size_inch: listingData.Screen_Size_inch || listingData.screen_size_inch,
          os: listingData.OS || listingData.os,
          price: listingData.price,
          storage: listingData.Storage || listingData.storage || [],
          images: listingData.images || listingData.imageUrl ? [listingData.imageUrl] : null,
        });

        // Pre-fill purchase price with listing price
        if (listingData.price) {
          setPurchasePrice(listingData.price.toString());
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId, router]);

  const handleGenerateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim() || !buyerPhone.trim() || !purchasePrice.trim()) {
      alert("Please fill in buyer name, phone, and purchase price");
      return;
    }

    if (!listing) return;

    setGenerating(true);

    try {
      // Prepare PC specs snapshot
      const pcSpecsSnapshot = {
        brand: listing.brand,
        model: listing.model,
        cpu: listing.cpu,
        ram_gb: listing.ram_gb,
        ram_type: listing.ram_type,
        gpu: listing.gpu,
        display_resolution: listing.display_resolution,
        screen_size_inch: listing.screen_size_inch,
        os: listing.os,
        storage: listing.storage,
        original_price: listing.price,
      };

      // Generate receipt number (format: RCPT-YYYY-MMDD-NNN)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const receiptNumber = `RCPT-${year}-${month}${day}-${randomNum}`;

      // Save receipt to database
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          receipt_number: receiptNumber,
          buyer_name: buyerName.trim(),
          buyer_phone: buyerPhone.trim(),
          buyer_address: buyerAddress.trim() || null,
          purchase_price: parseFloat(purchasePrice),
          seller_signature: sellerSignature || null,
          pc_specs_snapshot: pcSpecsSnapshot,
          notes: notes.trim() || null,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.status !== "ok") {
        throw new Error(result.error || "Failed to generate receipt");
      }

      // Redirect to receipt view page
      router.push(`/receipt/${result.data.id}`);
    } catch (error: any) {
      console.error("Error generating receipt:", error);
      alert(`Failed to generate receipt: ${error.message || "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Generate Receipt</h1>
          <p className="text-gray-600 mt-2">Create a receipt for the sold item</p>
        </div>

        {/* PC Details Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">PC Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Brand:</span>{" "}
              <span className="font-medium">{listing.brand || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Model:</span>{" "}
              <span className="font-medium">{listing.model || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">CPU:</span>{" "}
              <span className="font-medium">{listing.cpu || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">RAM:</span>{" "}
              <span className="font-medium">
                {listing.ram_gb && listing.ram_type
                  ? `${listing.ram_gb}GB ${listing.ram_type}`
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">GPU:</span>{" "}
              <span className="font-medium">{listing.gpu || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-600">Display:</span>{" "}
              <span className="font-medium">
                {listing.screen_size_inch && listing.display_resolution
                  ? `${listing.screen_size_inch}" ${listing.display_resolution}`
                  : "N/A"}
              </span>
            </div>
            {listing.price && (
              <div className="col-span-2">
                <span className="text-gray-600">Listed Price:</span>{" "}
                <span className="font-medium">{listing.price.toLocaleString()} ETB</span>
              </div>
            )}
          </div>
        </div>

        {/* Receipt Form */}
        <form onSubmit={handleGenerateReceipt} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Receipt Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter buyer's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter buyer's phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buyer Address (Optional)
              </label>
              <textarea
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter buyer's address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter purchase price"
              />
              <p className="text-xs text-gray-500 mt-1">
                Actual sale price (may differ from listed price)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seller Signature (Optional)
              </label>
              <input
                type="text"
                value={sellerSignature}
                onChange={(e) => setSellerSignature(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seller name or signature"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can add a digital signature or name here
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or terms"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating..." : "Generate Receipt"}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

export default function GenerateReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <GenerateReceiptContent />
    </Suspense>
  );
}

