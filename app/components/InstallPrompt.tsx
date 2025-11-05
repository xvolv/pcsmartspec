"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandaloneIOS = (window.navigator as any).standalone === true;

    if (isStandaloneIOS) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault();
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install prompt
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // For iOS, show prompt after a delay (since beforeinstallprompt doesn't fire on iOS)
    if (isIOS && !isStandaloneIOS) {
      // Check if prompt was dismissed before
      const promptDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (promptDismissed) {
        const dismissedTime = parseInt(promptDismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }
      // Show iOS install instructions after a short delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    } else {
      // For Android/Chrome, check if prompt was dismissed
      const promptDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (promptDismissed) {
        const dismissedTime = parseInt(promptDismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          setShowPrompt(false);
        }
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // For iOS, show instructions
      alert(
        "To install this app on your iOS device:\n\n" +
        "1. Tap the Share button (square with up arrow)\n" +
        "2. Scroll down and tap 'Add to Home Screen'\n" +
        "3. Tap 'Add' in the top right corner"
      );
      handleDismiss();
      return;
    }

    if (!deferredPrompt) {
      // Fallback: try to show browser menu
      alert("Please use your browser's menu to install this app.");
      handleDismiss();
      return;
    }

    // Show the browser's install prompt (Android/Chrome)
    await deferredPrompt.prompt();

    // Wait for user's response
          const { outcome } = await deferredPrompt.userChoice;

          if (outcome === "dismissed") {
            // Remember dismissal for 7 days
            localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
          }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if no prompt available (unless iOS which doesn't have beforeinstallprompt)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (!showPrompt || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Install Royal Smart Computer
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Add to your home screen for quick access and a better experience.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
