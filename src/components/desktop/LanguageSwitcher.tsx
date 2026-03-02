import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage, LANGUAGE_NAMES, type Language } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const languageFlags: Record<Language, string> = {
  "zh-CN": "🇨🇳",
  "zh-TW": "🇹🇼",
  "en": "🇺🇸",
};

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
          "bg-card border border-border hover:border-accent/50"
        )}
      >
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="hidden sm:inline">{LANGUAGE_NAMES[language]}</span>
        <span className="sm:hidden">{languageFlags[language]}</span>
        <ChevronDown className={cn(
          "w-3 h-3 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="p-1">
                {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                      language === lang
                        ? "bg-accent/15"
                        : "hover:bg-muted/10"
                    )}
                  >
                    <span className="text-base">{languageFlags[lang]}</span>
                    <span className="flex-1 text-sm font-medium">
                      {LANGUAGE_NAMES[lang]}
                    </span>
                    {language === lang && (
                      <Check className="w-4 h-4 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
