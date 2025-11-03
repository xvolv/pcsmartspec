"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Receipt = {
  id: string;
  listing_id: string | null;
  receipt_number: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string | null;
  sale_date: string;
  purchase_price: number;
  seller_signature: string | null;
  pc_specs_snapshot: any;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function SoldPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/receipts');
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok' && json.data) {
            setReceipts(json.data);
          }
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const filteredReceipts = useMemo(() => {
    if (!query.trim()) return receipts;
    
    const searchLower = query.toLowerCase();
    return receipts.filter((receipt) => {
      return (
        receipt.receipt_number.toLowerCase().includes(searchLower) ||
        receipt.buyer_name.toLowerCase().includes(searchLower) ||
        receipt.buyer_phone.toLowerCase().includes(searchLower) ||
        (receipt.buyer_address && receipt.buyer_address.toLowerCase().includes(searchLower))
      );
    });
  }, [receipts, query]);

  const totalRevenue = useMemo(() => {
    return receipts.reduce((sum, receipt) => sum + receipt.purchase_price, 0);
  }, [receipts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + " ETB";
  };

  const getPCSpecs = (snapshot: any) => {
    if (!snapshot) return null;
    
    // Handle both object and string formats
    if (typeof snapshot === 'string') {
      try {
        snapshot = JSON.parse(snapshot);
      } catch {
        return snapshot;
      }
    }

    const parts: string[] = [];
    
    if (snapshot.brand || snapshot.model) {
      parts.push(`${snapshot.brand || ''} ${snapshot.model || ''}`.trim());
    }
    if (snapshot.cpu) parts.push(`CPU: ${snapshot.cpu}`);
    if (snapshot.ram_gb) parts.push(`RAM: ${snapshot.ram_gb}GB`);
    if (snapshot.storage) {
      const storage = typeof snapshot.storage === 'string' 
        ? snapshot.storage 
        : JSON.stringify(snapshot.storage);
      parts.push(`Storage: ${storage}`);
    }
    if (snapshot.gpu) parts.push(`GPU: ${snapshot.gpu}`);
    
    return parts.length > 0 ? parts.join(' • ') : 'PC Specs';
  };

  const handleDeleteClick = (receipt: Receipt) => {
    setReceiptToDelete(receipt);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setReceiptToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!receiptToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/receipts/${receiptToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove receipt from list
        setReceipts((prev) => prev.filter((r) => r.id !== receiptToDelete.id));
        setDeleteConfirmOpen(false);
        setReceiptToDelete(null);
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to delete receipt');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-slate-900 flex flex-col">
      <Navbar />
      
      <main className="bg-zinc-50 text-zinc-900 flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-100 to-green-200">
                <i className="fa-solid fa-circle-check text-green-600 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-slate-800">Sold Items</h1>
                <p className="text-sm text-slate-500">Track your sales and receipts</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-lg font-light text-slate-800">{receipts.length}</div>
                <div className="text-xs text-slate-500">Total Sales</div>
              </div>
              <div className="w-px bg-slate-300"></div>
              <div className="text-center">
                <div className="text-lg font-light text-slate-800">{formatPrice(totalRevenue)}</div>
                <div className="text-xs text-slate-500">Total Revenue</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
            <div className="md:col-span-4">
              <div className="relative">
                <input
                  placeholder="Search by receipt number, buyer name, or phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 pl-11 text-slate-700 transition-all duration-200 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fa-solid fa-magnifying-glass" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Receipts List */}
        <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
              <p className="text-sm text-slate-500">Loading receipts...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <i className="fa-regular fa-folder-open text-slate-400 text-2xl" />
                </div>
              </div>
              <h3 className="text-lg font-light text-slate-700 mb-2">
                {query ? "No receipts found" : "No sales yet"}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {query 
                  ? "No receipts match your search criteria." 
                  : "You haven't made any sales yet. Start by generating a receipt from the dashboard."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="group rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:border-slate-300"
                >
                  {/* Receipt Header */}
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Receipt #</div>
                        <div className="text-sm font-semibold text-slate-800">{receipt.receipt_number}</div>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-medium bg-green-100/80 text-green-700">
                        <i className="fa-solid fa-circle-check" />
                        Sold
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      <i className="fa-regular fa-calendar mr-1" />
                      {formatDate(receipt.sale_date)}
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <div className="text-xs font-medium text-slate-500 mb-2">Buyer Information</div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-slate-800">{receipt.buyer_name}</div>
                      <div className="text-xs text-slate-600">
                        <i className="fa-regular fa-phone mr-1" />
                        {receipt.buyer_phone}
                      </div>
                      {receipt.buyer_address && (
                        <div className="text-xs text-slate-600">
                          <i className="fa-regular fa-location-dot mr-1" />
                          {receipt.buyer_address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PC Specs */}
                  {receipt.pc_specs_snapshot && (
                    <div className="mb-4 pb-4 border-b border-slate-200">
                      <div className="text-xs font-medium text-slate-500 mb-2">PC Details</div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {getPCSpecs(receipt.pc_specs_snapshot)}
                      </p>
                    </div>
                  )}

                  {/* Price & Actions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Sale Price</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatPrice(receipt.purchase_price)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteClick(receipt)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-100 hover:scale-105"
                        title="Delete Receipt"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/receipt/${receipt.id}`)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:scale-105"
                    >
                      <i className="fa-regular fa-eye" />
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Footer */}
          {!loading && filteredReceipts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <span>
                    Showing {filteredReceipts.length} of {receipts.length} receipts
                  </span>
                  {query && (
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-magnifying-glass text-xs" />
                      Filtered by "{query}"
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-medium text-slate-700">
                    Total Revenue: {formatPrice(totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Popup */}
      {deleteConfirmOpen && receiptToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Receipt</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this receipt? This action cannot be undone and will remove it from sales records.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                Receipt #: {receiptToDelete.receipt_number}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Buyer: {receiptToDelete.buyer_name}
              </p>
              <p className="text-sm text-gray-600">
                Sale Price: {formatPrice(receiptToDelete.purchase_price)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sale Date: {formatDate(receiptToDelete.sale_date)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* FontAwesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}
