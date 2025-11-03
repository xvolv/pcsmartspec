"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface Receipt {
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
    created_at: string;
}

export default function ReceiptViewPage() {
    const router = useRouter();
    const params = useParams();
    const receiptId = params.id as string;

    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingPDF, setSavingPDF] = useState(false);
    const [pdfSuccess, setPdfSuccess] = useState(false);
    const [showFileNameDialog, setShowFileNameDialog] = useState(false);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [defaultFileName, setDefaultFileName] = useState('');
    const receiptContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!receiptId) {
            router.push("/dashboard");
            return;
        }

        const fetchReceipt = async () => {
            try {
                const res = await fetch(`/api/receipts/${receiptId}`, { cache: "no-store" });
                const result = await res.json();

                if (!res.ok || result.status !== "ok") {
                    setError(result.error || "Receipt not found");
                    return;
                }

                setReceipt(result.data);
            } catch (err: any) {
                console.error("Error fetching receipt:", err);
                setError("Failed to load receipt");
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptId, router]);

    const handlePrint = () => {
        if (typeof window === 'undefined') {
            return;
        }

        // Direct print call - works on all devices when triggered by user action
        // Mobile browsers require this to be in a direct user event handler
        window.print();
    };

    const handleSavePDF = async () => {
        if (typeof window === 'undefined' || !receiptContainerRef.current) {
            return;
        }

        setSavingPDF(true);
        try {
            const container = receiptContainerRef.current;

            // Wait a bit for any images to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture the receipt container as canvas
            // Temporarily fix CSS to avoid lab() color issues
            const originalStyle = container.getAttribute('style') || '';

            // Create a style element to override problematic colors and remove borders
            const overrideStyle = document.createElement('style');
            overrideStyle.textContent = `
        .receipt-container, .receipt-container * {
          color: rgb(0, 0, 0) !important;
          background-color: rgb(255, 255, 255) !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .receipt-container {
          background-color: rgb(255, 255, 255) !important;
          border: none !important;
          box-shadow: none !important;
        }
        .text-black {
          color: rgb(0, 0, 0) !important;
        }
        .text-gray-600 {
          color: rgb(75, 85, 99) !important;
        }
        .border-gray-400,
        .border-black {
          border: none !important;
        }
      `;
            document.head.appendChild(overrideStyle);

            try {
                // Get actual container dimensions - ensure we capture everything
                // Save all original styles to restore later
                const originalOverflow = container.style.overflow;
                const originalWidth = container.style.width;
                const originalMaxWidth = container.style.maxWidth;
                const originalMargin = container.style.margin;
                const originalPosition = container.style.position;
                const originalLeft = container.style.left;
                const originalRight = container.style.right;
                const originalTransform = container.style.transform;

                // Ensure the element fits fully on screen before capture
                // Remove centering and force natural width
                container.style.overflow = 'visible';
                container.style.width = 'auto'; // Let content determine width naturally
                container.style.maxWidth = 'none';
                container.style.margin = '0'; // Remove centering during capture
                container.style.position = 'static'; // Remove absolute/relative positioning
                container.style.left = 'auto';
                container.style.right = 'auto';
                container.style.transform = 'none';

                // Scroll to top to ensure we capture from the beginning
                window.scrollTo(0, 0);

                // Wait for layout to update
                await new Promise(resolve => setTimeout(resolve, 300));

                // Get actual content dimensions (not viewport)
                const scrollWidth = container.scrollWidth;
                const scrollHeight = container.scrollHeight;
                const rect = container.getBoundingClientRect();

                // Use scroll dimensions to ensure we capture everything
                const actualWidth = Math.ceil(scrollWidth);
                const actualHeight = Math.ceil(scrollHeight);

                const canvas = await html2canvas(container, {
                    scale: 2, // Higher quality
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: actualWidth,
                    height: actualHeight,
                    windowWidth: actualWidth,
                    windowHeight: actualHeight,
                } as any);

                // Restore original styles
                container.style.overflow = originalOverflow || '';
                container.style.width = originalWidth || '';
                container.style.maxWidth = originalMaxWidth || '';
                container.style.margin = originalMargin || '';
                container.style.position = originalPosition || '';
                container.style.left = originalLeft || '';
                container.style.right = originalRight || '';
                container.style.transform = originalTransform || '';

                // Remove the override style
                document.head.removeChild(overrideStyle);

                // Calculate PDF dimensions (A4 half page: 210mm x 148mm)
                const pdfWidth = 210; // mm
                const pdfHeight = 148; // mm

                // Create PDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight],
                });

                // Simple centering approach with equal margins
                // Leave equal margins on all sides for a clean, centered look
                const margin = 10; // 10mm margin on all sides
                const contentWidth = pdfWidth - (margin * 2); // 190mm content width
                const contentHeight = pdfHeight - (margin * 2); // 128mm content height

                // Calculate image dimensions to fit within content area while maintaining aspect ratio
                const canvasAspect = canvas.width / canvas.height;
                const contentAspect = contentWidth / contentHeight;

                let imgWidth, imgHeight;

                if (canvasAspect > contentAspect) {
                    // Canvas is wider - fit to width
                    imgWidth = contentWidth;
                    imgHeight = (canvas.height * imgWidth) / canvas.width;
                } else {
                    // Canvas is taller - fit to height
                    imgHeight = contentHeight;
                    imgWidth = (canvas.width * imgHeight) / canvas.height;
                }

                // Center the image in the PDF with equal margins
                const imgX = (pdfWidth - imgWidth) / 2; // Center horizontally
                const imgY = (pdfHeight - imgHeight) / 2; // Center vertically

                // Add image to PDF (centered with equal margins)
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);

                // Generate default filename
                const defaultFileName = `Receipt-${receipt?.receipt_number || receiptId}-${new Date().getTime()}.pdf`;

                // Create PDF blob
                const pdfBlob = pdf.output('blob');

                // Store blob and show dialog for user to choose filename
                setPdfBlob(pdfBlob);
                setDefaultFileName(defaultFileName);
                setShowFileNameDialog(true);

                console.log('PDF generated, ready for download');
            } catch (canvasError) {
                // Remove the override style even if there's an error
                if (document.head.contains(overrideStyle)) {
                    document.head.removeChild(overrideStyle);
                }
                throw canvasError;
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setSavingPDF(false);
        }
    };

    const handleConfirmDownload = (fileName: string) => {
        if (!pdfBlob) {
            alert('PDF is not ready. Please try again.');
            return;
        }

        // Clean filename - remove .pdf if user added it, then add it back
        let cleanFileName = fileName.trim();
        if (!cleanFileName) {
            cleanFileName = defaultFileName.replace('.pdf', '');
        }
        if (cleanFileName.endsWith('.pdf')) {
            cleanFileName = cleanFileName.replace('.pdf', '');
        }
        // Remove invalid characters from filename
        cleanFileName = cleanFileName.replace(/[<>:"/\\|?*]/g, '_');
        const finalFileName = `${cleanFileName}.pdf`;

        // Check if we're on mobile - use simpler download method
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile || !('showSaveFilePicker' in window)) {
            // For mobile, always use download link method
            downloadWithLink(finalFileName);
            return;
        }

        // For desktop, try File System Access API first
        try {
            (window as any).showSaveFilePicker({
                suggestedName: finalFileName,
                types: [{
                    description: 'PDF Files',
                    accept: {
                        'application/pdf': ['.pdf'],
                    },
                }],
            }).then(async (fileHandle: any) => {
                const writable = await fileHandle.createWritable();
                await writable.write(pdfBlob);
                await writable.close();

                setShowFileNameDialog(false);
                setPdfBlob(null);
                setDefaultFileName('');
                setPdfSuccess(true);
                setTimeout(() => setPdfSuccess(false), 3000);
            }).catch((err: any) => {
                if (err.name !== 'AbortError') {
                    console.error('Error saving file:', err);
                    // Fallback to download link method
                    downloadWithLink(finalFileName);
                } else {
                    // User cancelled
                    setShowFileNameDialog(false);
                    setPdfBlob(null);
                    setDefaultFileName('');
                }
            });
        } catch (error) {
            console.error('Error in save file picker:', error);
            // Fallback to download link method
            downloadWithLink(finalFileName);
        }
    };

    const downloadWithLink = (fileName: string) => {
        if (!pdfBlob) return;

        try {
            const url = URL.createObjectURL(pdfBlob);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            if (isMobile) {
                // For mobile: Simple direct download - trigger immediately in user gesture context
                setShowFileNameDialog(false);

                // Create download link immediately (must be in user gesture context)
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);

                // Trigger download immediately (synchronously in click handler)
                link.click();

                // Clean up and show success
                setTimeout(() => {
                    if (document.body.contains(link)) {
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(url);

                    setPdfBlob(null);
                    setDefaultFileName('');
                    setPdfSuccess(true);
                    setTimeout(() => setPdfSuccess(false), 3000);
                }, 100);
            } else {
                // For desktop: Try standard download
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }, 1000);

                setShowFileNameDialog(false);
                setPdfBlob(null);
                setDefaultFileName('');
                setPdfSuccess(true);
                setTimeout(() => setPdfSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try again or use your browser\'s download menu.');
            setShowFileNameDialog(false);
            setPdfBlob(null);
            setDefaultFileName('');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
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

    if (error || !receipt) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <Navbar />
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-2xl font-bold mb-4">{error || "Receipt not found"}</h1>
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

    const pcSpecs = receipt.pc_specs_snapshot || {};

    return (
        <>
            <style jsx global>{`
        /* Mobile responsive styles */
        @media (max-width: 640px) {
          .receipt-container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 16px !important;
            font-size: 12px !important;
            transform: none !important;
            zoom: 1 !important;
          }
          .receipt-container h1 {
            font-size: 16px !important;
          }
          .receipt-container h2 {
            font-size: 14px !important;
          }
          .receipt-container p,
          .receipt-container span {
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .receipt-container img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
        @media print {
          nav,
          footer,
          .no-print,
          .print-button,
          header,
          #__next > header,
          #__next > footer {
            display: none !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-container {
            max-width: 210mm !important;
            width: 210mm !important;
            min-height: 148mm !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 12mm !important;
            box-shadow: none !important;
            border: 1px solid black !important;
            page-break-after: always !important;
            overflow: hidden !important;
          }
          @page {
            size: A4;
            margin: 0 !important;
          }
          html,
          body {
            width: 210mm !important;
            height: auto !important;
            min-height: 297mm !important;
          }
          /* Remove any Next.js or localhost text */
          body::after,
          body::before,
          *::after,
          *::before {
            content: none !important;
          }
          /* Hide any links or URLs */
          a[href^="http"],
          a[href^="//"],
          a[href^="/"] {
            text-decoration: none !important;
            color: black !important;
          }
          a[href^="http"]::after,
          a[href^="//"]::after {
            content: none !important;
          }
          /* Hide Next.js development info */
          [data-nextjs-scroll-focus-boundary],
          [nextjs-portal] {
            display: none !important;
          }
          /* Remove any URL text from print */
          .container,
          main {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide any script-generated content */
          script,
          style:not([data-jsx]),
          noscript {
            display: none !important;
          }
          /* Remove page title from print */
          title {
            display: none !important;
          }
          /* Ensure no background colors on print */
          * {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-container * {
            background: transparent !important;
          }
          /* Logo print styles */
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            max-width: 100% !important;
            display: block !important;
          }
        }
      `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 print:bg-white">
                <Navbar />
                <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-2xl print:max-w-none print:px-0 print:py-0">
                    {/* File Name Dialog */}
                    {showFileNameDialog && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                <h3 className="text-lg font-semibold mb-4">Save PDF As</h3>
                                <div className="mb-4">
                                    <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-2">
                                        File Name
                                    </label>
                                    <input
                                        type="text"
                                        id="fileName"
                                        defaultValue={defaultFileName.replace('.pdf', '')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter file name"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.target as HTMLInputElement;
                                                handleConfirmDownload(input.value);
                                            }
                                        }}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">File will be saved as .pdf</p>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowFileNameDialog(false);
                                            setPdfBlob(null);
                                            setDefaultFileName('');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('fileName') as HTMLInputElement;
                                            handleConfirmDownload(input.value);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {pdfSuccess && (
                        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-3 print:hidden">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">✓ PDF downloaded successfully!</span>
                        </div>
                    )}

                    {/* Action Buttons - Hidden when printing */}
                    <div className="mb-4 sm:mb-6 print:hidden print-button flex flex-col sm:flex-row gap-3">
                        {/* Print Button - Show on desktop */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePrint();
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePrint();
                            }}
                            type="button"
                            className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
                            aria-label="Print"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            Print
                        </button>

                        {/* Save as PDF Button - Show on all devices, especially mobile */}
                        <button
                            onClick={handleSavePDF}
                            type="button"
                            disabled={savingPDF}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Save as PDF"
                        >
                            {savingPDF ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Save as PDF
                                </>
                            )}
                        </button>
                    </div>

                    {/* Receipt Container */}
                    <div ref={receiptContainerRef} className="receipt-container bg-white border border-gray-400 rounded-lg sm:rounded-none p-4 sm:p-6 shadow-sm print:shadow-none print:border-2 print:border-black relative w-full mx-auto overflow-x-auto sm:overflow-visible">
                        {/* Small Circular Logo - Top Left Corner */}
                        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
                            <img
                                src="/logo.png"
                                alt="PCSmartSpec Logo"
                                className="w-12 h-12 sm:w-16 sm:h-16 print:w-14 print:h-14 rounded-full object-cover border-2 border-black print:border-black"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* All Content */}
                        <div className="relative z-0">
                            {/* Company Header */}
                            <div className="text-center mb-3 sm:mb-4 border-b border-gray-400 pb-2 sm:pb-3 print:border-black">
                                <h1 className="text-lg sm:text-xl font-bold text-black mb-1">PCSmartSpec</h1>
                                <p className="text-xs text-black">Computer Sales & Service</p>
                                <div className="mt-1 text-xs text-black space-y-0">
                                    <p className="print:p-10">Phone: +251 911 234 567</p>
                                    <p>Addis Ababa, Ethiopia</p>
                                </div>
                            </div>

                            {/* Receipt Number & Date */}
                            <div className="mb-2 sm:mb-3 pb-2 border-b border-gray-400 print:border-black">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-0.5">Receipt No:</p>
                                        <p className="text-sm font-semibold text-black break-all">{receipt.receipt_number}</p>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-xs text-gray-600 mb-0.5">Sale Date:</p>
                                        <p className="text-sm font-semibold text-black">{formatDate(receipt.sale_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Buyer Information */}
                            <div className="mb-2 sm:mb-3 pb-2 border-b border-gray-400 print:border-black">
                                <h2 className="text-xs sm:text-sm font-semibold text-black mb-1 sm:mb-1.5">Buyer Information</h2>
                                <div className="space-y-1 text-xs">
                                    <div>
                                        <span className="text-gray-600">Name:</span>{" "}
                                        <span className="font-medium text-black">{receipt.buyer_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Phone:</span>{" "}
                                        <span className="font-medium text-black">{receipt.buyer_phone}</span>
                                    </div>
                                    {receipt.buyer_address && (
                                        <div>
                                            <span className="text-gray-600">Address:</span>{" "}
                                            <span className="font-medium text-black">{receipt.buyer_address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PC Details - Minimized */}
                            <div className="mb-2 sm:mb-3 pb-2 border-b border-gray-400 print:border-black">
                                <h2 className="text-xs sm:text-sm font-semibold text-black mb-1 sm:mb-1.5">Item Details</h2>
                                <div className="text-xs space-y-0.5">
                                    <p className="font-medium text-black">
                                        {pcSpecs.brand || "—"} {pcSpecs.model || ""}
                                    </p>
                                    {pcSpecs.cpu && (
                                        <p className="text-black">
                                            <span className="text-gray-600">CPU:</span> {pcSpecs.cpu}
                                        </p>
                                    )}
                                    {(pcSpecs.ram_gb || pcSpecs.ram_type) && (
                                        <p className="text-black">
                                            <span className="text-gray-600">RAM:</span> {pcSpecs.ram_gb || ""}{" "}
                                            {pcSpecs.ram_type || ""}
                                        </p>
                                    )}
                                    {pcSpecs.gpu && (
                                        <p className="text-black">
                                            <span className="text-gray-600">GPU:</span> {pcSpecs.gpu}
                                        </p>
                                    )}
                                    {(pcSpecs.screen_size_inch || pcSpecs.display_resolution) && (
                                        <p className="text-black">
                                            <span className="text-gray-600">Display:</span> {pcSpecs.screen_size_inch || ""}
                                            " {pcSpecs.display_resolution || ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Signature */}
                            {receipt.seller_signature && (
                                <div className="mb-2 sm:mb-3 pb-2 border-b border-gray-400 print:border-black">
                                    <div className="text-xs">
                                        <p className="text-gray-600 mb-0.5 sm:mb-1">Authorized Signature:</p>
                                        <p className="font-medium text-black break-words">{receipt.seller_signature}</p>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 pt-2 border-t border-gray-400 print:border-black text-center text-xs text-black space-y-0.5">
                                <p className="font-semibold text-black">Thank you for your purchase!</p>
                                <p>For inquiries, contact us at +251 911 234 567</p>
                                <p className="mt-1 text-xs">Receipt ID: {receipt.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </>
    );
}

