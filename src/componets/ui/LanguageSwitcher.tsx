import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = i18n.language || "ar";

  const languages = [
    { code: "ar", name: "العربية", flag: "🇸🇦" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLang = languages.find((lang) => lang.code === currentLanguage);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang?.flag} {currentLang?.code.toUpperCase()}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${
              currentLanguage === "ar" ? "left-0" : "right-0"
            } mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50`}
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  currentLanguage === lang.code
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700"
                }`}
                whileHover={{ x: currentLanguage === "ar" ? -5 : 5 }}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {currentLanguage === lang.code && (
                  <span className="mr-auto text-blue-600">✓</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default LanguageSwitcher;
