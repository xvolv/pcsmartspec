"use client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useEffect, useMemo, useState } from "react";

type Listing = {
  id: string;
  brand: string | null;
  model: string | null;
  price: number | null;
  status: 'draft' | 'published' | 'sold';
  created_at: string;
};

type Receipt = {
  id: string;
  receipt_number: string;
  buyer_name: string;
  purchase_price: number;
  sale_date: string;
  created_at: string;
};

export default function SalesAnalyticsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"week" | "3days" | "day">("week");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch listings
        const listingsRes = await fetch('/api/listings');
        if (listingsRes.ok) {
          const listingsJson = await listingsRes.json();
          if (listingsJson.status === 'ok' && listingsJson.data) {
            setListings(listingsJson.data);
          }
        }

        // Fetch receipts
        const receiptsRes = await fetch('/api/receipts');
        if (receiptsRes.ok) {
          const receiptsJson = await receiptsRes.json();
          if (receiptsJson.status === 'ok' && receiptsJson.data) {
            setReceipts(receiptsJson.data);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (range) {
      case "day":
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case "3days":
        cutoffDate.setDate(now.getDate() - 3);
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        cutoffDate.setHours(0, 0, 0, 0);
        break;
    }

    const filteredReceipts = receipts.filter((receipt) => {
      const saleDate = new Date(receipt.sale_date);
      return saleDate >= cutoffDate;
    });

    return {
      receipts: filteredReceipts,
      allReceipts: receipts,
      allListings: listings,
    };
  }, [receipts, listings, range]);

  // Calculate statistics
  const stats = useMemo(() => {
    const { receipts: rangeReceipts, allReceipts, allListings } = filteredData;

    // Published listings (excluding drafts)
    const publishedListings = allListings.filter((l) => l.status === 'published');
    const publishedCount = publishedListings.length;

    // Sold count should be based on receipts, not listing status
    // When a receipt is generated, that means an item was sold
    const soldCount = allReceipts.length;

    // Total receipts count
    const totalReceipts = allReceipts.length;

    // Total revenue from all receipts
    const totalRevenue = allReceipts.reduce((sum, r) => sum + r.purchase_price, 0);

    // Revenue in selected range
    const rangeRevenue = rangeReceipts.reduce((sum, r) => sum + r.purchase_price, 0);

    // Sales count in selected range
    const rangeSalesCount = rangeReceipts.length;

    // Average sale price
    const avgSalePrice = allReceipts.length > 0
      ? Math.round(totalRevenue / allReceipts.length)
      : 0;


    // Average listing price
    const avgListingPrice = publishedListings.length > 0
      ? Math.round(
          publishedListings.reduce((sum, l) => sum + (l.price || 0), 0) / publishedListings.length
        )
      : 0;

    // Revenue per sale (average revenue per receipt)
    const revenuePerSale = allReceipts.length > 0 ? Math.round(totalRevenue / allReceipts.length) : 0;

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReceipts = allReceipts.filter((r) => {
      const saleDate = new Date(r.sale_date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });
    const todayRevenue = todayReceipts.reduce((sum, r) => sum + r.purchase_price, 0);

    // This week revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekReceipts = allReceipts.filter((r) => {
      const saleDate = new Date(r.sale_date);
      return saleDate >= weekStart;
    });
    const weekRevenue = weekReceipts.reduce((sum, r) => sum + r.purchase_price, 0);

    // This month revenue
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthReceipts = allReceipts.filter((r) => {
      const saleDate = new Date(r.sale_date);
      return saleDate >= monthStart;
    });
    const monthRevenue = monthReceipts.reduce((sum, r) => sum + r.purchase_price, 0);

    return {
      publishedCount,
      soldCount,
      totalReceipts,
      totalRevenue,
      rangeRevenue,
      rangeSalesCount,
      avgSalePrice,
      avgListingPrice,
      revenuePerSale,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      availableListings: publishedCount - soldCount,
    };
  }, [filteredData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + " ETB";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 text-slate-900 flex flex-col">
      <Navbar />
      <main className="bg-zinc-50 text-zinc-900 flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-blue-200">
                <i className="fa-solid fa-chart-column text-blue-600 text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-light text-slate-800">Sales Analytics</h1>
                <p className="text-sm text-slate-500">Track your business performance and insights</p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-slate-100/80 rounded-2xl p-1.5">
              {(["week", "3days", "day"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                    range === r 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  {r === "week" ? "This Week" : r === "3days" ? "Last 3 Days" : "Today"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-2">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-md hover:border-slate-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                      <i className="fa-solid fa-circle-check text-green-600 text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Total Sales</div>
                      <div className="text-2xl font-light text-slate-800">{stats.totalReceipts}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {stats.rangeSalesCount} in selected range
                  </div>
                </div>


                <div className="rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-md hover:border-slate-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <i className="fa-solid fa-sack-dollar text-emerald-600 text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">Total Revenue</div>
                      <div className="text-2xl font-light text-slate-800">{formatPrice(stats.totalRevenue)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatPrice(stats.rangeRevenue)} in selected range
                  </div>
                </div>

              </div>
            </>
          )}
        </section>

        {!loading && (
          <>
            {/* Revenue Breakdown */}
            <section className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-emerald-100 to-emerald-200">
                  <i className="fa-solid fa-calendar-dollar text-emerald-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-light text-slate-800">Revenue Breakdown</h2>
                  <p className="text-sm text-slate-500">Revenue by time period</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-sun text-yellow-500 text-sm" />
                    <div className="text-sm font-medium text-slate-700">Today</div>
                  </div>
                  <div className="text-2xl font-light text-slate-800">{formatPrice(stats.todayRevenue)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {receipts.filter((r) => {
                      const saleDate = new Date(r.sale_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      saleDate.setHours(0, 0, 0, 0);
                      return saleDate.getTime() === today.getTime();
                    }).length} sales
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-calendar-week text-blue-500 text-sm" />
                    <div className="text-sm font-medium text-slate-700">This Week</div>
                  </div>
                  <div className="text-2xl font-light text-slate-800">{formatPrice(stats.weekRevenue)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {receipts.filter((r) => {
                      const saleDate = new Date(r.sale_date);
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      weekStart.setHours(0, 0, 0, 0);
                      return saleDate >= weekStart;
                    }).length} sales
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-calendar text-purple-500 text-sm" />
                    <div className="text-sm font-medium text-slate-700">This Month</div>
                  </div>
                  <div className="text-2xl font-light text-slate-800">{formatPrice(stats.monthRevenue)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {receipts.filter((r) => {
                      const saleDate = new Date(r.sale_date);
                      const monthStart = new Date();
                      monthStart.setDate(1);
                      monthStart.setHours(0, 0, 0, 0);
                      return saleDate >= monthStart;
                    }).length} sales
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-trend-up text-green-500 text-sm" />
                    <div className="text-sm font-medium text-slate-700">Revenue Trend</div>
                  </div>
                  <div className="text-xs text-slate-600">
                    {stats.totalRevenue > 1000000 
                      ? "Strong revenue growth observed" 
                      : stats.totalRevenue > 500000 
                      ? "Steady revenue stream maintained" 
                      : "Building revenue foundation"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-chart-line text-blue-500 text-sm" />
                    <div className="text-sm font-medium text-slate-700">Sales Performance</div>
                  </div>
                  <div className="text-xs text-slate-600">
                    {stats.totalReceipts > 50 
                      ? "Great sales volume! Continue the momentum." 
                      : stats.totalReceipts > 20 
                      ? "Good sales activity. Keep it up!" 
                      : "Focus on increasing sales volume."}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {/* FontAwesome CSS */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}
