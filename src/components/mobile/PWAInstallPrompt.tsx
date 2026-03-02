import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const { language } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(checkStandalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Don't show for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS, show prompt after delay
    if (iOS && !checkStandalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) return null;

  const texts = {
    title: language === "en" ? "Install Career Anchors" : language === "zh-TW" ? "安裝職業錨測評" : "安装职业锚测评",
    description: language === "en" 
      ? "Add to home screen for quick access" 
      : language === "zh-TW" ? "加入主畫面，隨時隨地測評" : "添加到主屏幕，随时随地测评",
    install: language === "en" ? "Install" : language === "zh-TW" ? "安裝" : "安装",
    iosTitle: language === "en" ? "Add to Home Screen" : language === "zh-TW" ? "加入主畫面" : "添加到主屏幕",
    iosStep1: language === "en" ? "Tap the Share button" : language === "zh-TW" ? "點擊底部分享按鈕" : "点击底部分享按钮",
    iosStep2: language === "en" ? 'Select "Add to Home Screen"' : language === "zh-TW" ? '選擇"加入主畫面"' : '选择"添加到主屏幕"',
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 left-4 right-4 z-50"
        >
          <div 
            className="rounded-2xl shadow-lg border p-4"
            style={{ 
              backgroundColor: "white",
              borderColor: "hsl(75, 55%, 85%)"
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {isIOS ? (
              // iOS instructions
              <div className="pr-6">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "hsl(75, 55%, 90%)" }}
                  >
                    <Plus className="w-5 h-5" style={{ color: "hsl(75, 55%, 45%)" }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: "hsl(228, 51%, 23%)" }}>
                    {texts.iosTitle}
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Share className="w-4 h-4" style={{ color: "hsl(228, 51%, 50%)" }} />
                    <span>{texts.iosStep1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" style={{ color: "hsl(228, 51%, 50%)" }} />
                    <span>{texts.iosStep2}</span>
                  </div>
                </div>
              </div>
            ) : (
              // Android/Desktop install prompt
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "hsl(75, 55%, 90%)" }}
                >
                  <Download className="w-6 h-6" style={{ color: "hsl(75, 55%, 45%)" }} />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="font-semibold mb-0.5" style={{ color: "hsl(228, 51%, 23%)" }}>
                    {texts.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {texts.description}
                  </p>
                </div>
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 rounded-xl font-medium text-sm text-white flex-shrink-0"
                  style={{ backgroundColor: "hsl(228, 51%, 23%)" }}
                >
                  {texts.install}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
