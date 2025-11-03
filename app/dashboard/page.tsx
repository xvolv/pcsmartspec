"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import NewComputerModal, { type NewComputerData } from "../components/NewComputerModal";
import EditListingModal from "../components/EditListingModal";

export type Listing = {
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
  description: string | null;
  images: string[] | null;
  status: 'draft' | 'published' | 'sold';
  created_at: string;
  updated_at: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: Currently there's no user-specific endpoint, so this fetches all published listings
      // In a real app, you'd fetch /api/listings/my-listings or similar
      const res = await fetch('/api/listings', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load listings');
      
      const data = await res.json();
      if (data.status === 'ok') {
        // Transform to internal format
        const transformed: Listing[] = data.data.map((item: any) => ({
          id: item.id,
          brand: item.brand || item.Brand || null,
          model: item.model || item.Model || null,
          cpu: item.cpu || item.CPU || null,
          ram_gb: item.ram_gb || item.RAM_GB || null,
          ram_type: item.ram_type || item.RAM_Type || null,
          gpu: item.gpu || item.GPU || null,
          display_resolution: item.display_resolution || item.Display_Resolution || null,
          screen_size_inch: item.screen_size_inch || item.Screen_Size_inch || null,
          os: item.os || item.OS || null,
          price: item.price || null,
          description: item.description || null,
          images: item.images || null,
          status: item.status || 'published',
          created_at: item.created_at || item.createdAt || new Date().toISOString(),
          updated_at: item.updated_at || null,
        }));
        setListings(transformed);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load listings');
      console.error('Error loading listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    // Apply search filter if query exists
    if (!searchQuery.trim()) {
      return true;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    // Build a comprehensive search text from all relevant fields
    const searchableText = [
      listing.brand || '',
      listing.model || '',
      listing.cpu || '',
      listing.ram_gb?.toString() || '',
      listing.ram_type || '',
      listing.gpu || '',
      listing.display_resolution || '',
      listing.screen_size_inch?.toString() || '',
      listing.os || '',
      listing.description || '',
      listing.price?.toString() || '',
      listing.status || '',
      // Combine fields for better matching
      `${listing.brand || ''} ${listing.model || ''}`,
      `${listing.ram_gb || ''} ${listing.ram_type || ''}`,
      `${listing.screen_size_inch || ''} ${listing.display_resolution || ''}`,
    ]
      .map(field => field.toLowerCase())
      .join(' ')
      .trim();
    
    // Check if all query words appear in the searchable text (supports multi-word search)
    const matches = queryWords.length > 0 
      ? queryWords.every(word => searchableText.includes(word))
      : searchableText.includes(query);
    
    return matches;
  });

  const stats = {
    total: listings.length,
    published: listings.filter(l => l.status === 'published').length,
  };

  const handleAddFromModal = async (data: NewComputerData): Promise<boolean> => {
    try {
      const payload = {
        title: data.name,
        price: String(data.price ?? ""),
        negotiable: data.negotiable,
        brand: data.brand,
        series: data.series,
        model: data.model,
        condition: data.condition,
        batteryCondition: data.batteryCondition,
        extraItems: data.extraItems,
        warranty: data.warranty,
        refreshRate: data.refreshRate,
        cpuBrand: data.cpuBrand,
        cpuSeries: data.cpuSeries,
        cpuGeneration: data.cpuGeneration,
        cpuModel: data.cpuModel,
        ramType: data.ramType,
        ramCapacity: data.ramCapacity,
        storageTypeMain: data.storageTypeMain,
        storageCapacity: data.storageCapacity,
        screenSize: data.screenSize,
        resolution: data.resolution,
        gpuType: data.gpuType,
        gpuBrand: data.gpuBrand,
        gpuSeries: data.gpuSeries,
        gpuVram: data.gpuVram,
        specs: data.specs,
        images: data.images,
      };

      const res = await fetch('/api/listings/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        alert(`❌ Save failed: ${res.status} ${res.statusText}`);
        return false;
      }

      alert('✅ Listing published successfully!');
      setUploadOpen(false);
      loadListings(); // Reload to show the new listing
      return true;
    } catch (err: any) {
      console.error('Error publishing listing:', err);
      alert(`❌ Error: ${err?.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleUpdateListing = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || result.status !== 'ok') {
        alert(`❌ Update failed: ${result.error || 'Unknown error'}`);
        return false;
      }

      alert('✅ Listing updated successfully!');
      loadListings(); // Reload to show the updated listing
      return true;
    } catch (err: any) {
      console.error('Error updating listing:', err);
      alert(`❌ Error: ${err?.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleEditClick = (listing: Listing) => {
    setSelectedListing(listing);
    setEditOpen(true);
  };

  const handleDeleteClick = (listing: Listing) => {
    setListingToDelete(listing);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/listings/${listingToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok || result.status !== 'ok') {
        alert(`❌ Delete failed: ${result.error || 'Unknown error'}`);
        return;
      }

      // Reload listings after successful delete
      loadListings();
      setDeleteConfirmOpen(false);
      setListingToDelete(null);
    } catch (err: any) {
      console.error('Error deleting listing:', err);
      alert(`❌ Error: ${err?.message || 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setListingToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your listings</p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Listing
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings... (brand, model, CPU, RAM, GPU, price, etc.)"
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredListings.length === 0 
                ? 'No listings found matching your search.'
                : `Found ${filteredListings.length} listing${filteredListings.length === 1 ? '' : 's'} matching "${searchQuery}"`
              }
            </p>
          )}
        </div>


        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Image */}
                <Link href={`/listings/${listing.id}`}>
                  <div className="relative h-48 w-full bg-gray-100">
                    {/* Generate Receipt Button - Top Right Corner */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/receipt/generate?listingId=${listing.id}`);
                      }}
                      className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                      title="Generate Receipt"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Receipt
                    </button>
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={`${listing.brand} ${listing.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-laptop.jpg';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {listing.brand} {listing.model}
                      </h3>
                    </div>
                    {listing.price && (
                      <div className="text-xl font-bold text-blue-600 ml-2">
                        {listing.price.toLocaleString()} ETB
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="space-y-1 text-xs text-gray-600 mb-4">
                    {listing.cpu && <div>CPU: {listing.cpu}</div>}
                    {listing.ram_gb && listing.ram_type && (
                      <div>{listing.ram_gb}GB {listing.ram_type}</div>
                    )}
                    {listing.gpu && <div>GPU: {listing.gpu}</div>}
                    {listing.screen_size_inch && listing.display_resolution && (
                      <div>{listing.screen_size_inch}" {listing.display_resolution}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {listing.status === 'published' && '✓ Published'}
                      {listing.status !== 'published' && '—'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(listing)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(listing)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "No listings match your search criteria"
                : "Get started by creating your first listing"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Listing
              </button>
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* New Listing Modal */}
      <NewComputerModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onAdd={handleAddFromModal}
      />

      {/* Edit Listing Modal */}
      <EditListingModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedListing(null);
        }}
        listing={selectedListing}
        onUpdate={handleUpdateListing}
      />

      {/* Delete Confirmation Popup */}
      {deleteConfirmOpen && listingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Listing</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this listing? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                {listingToDelete.brand} {listingToDelete.model}
              </p>
              {listingToDelete.price && (
                <p className="text-sm text-gray-600 mt-1">
                  {listingToDelete.price.toLocaleString()} ETB
                </p>
              )}
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
    </div>
  );
}