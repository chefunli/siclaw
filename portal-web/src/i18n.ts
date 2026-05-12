import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "./locales/en.json"
import zhCN from "./locales/zh-CN.json"

const LANGUAGE_KEY = "siclaw.language"

// Get saved language preference or default to Chinese
export const getSavedLanguage = (): string => {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    if (saved && (saved === "en" || saved === "zh-CN")) {
      return saved
    }
  } catch {
    // Ignore localStorage errors
  }
  return "zh-CN" // Default to Chinese
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-CN": { translation: zhCN },
    },
    lng: getSavedLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

// Helper to save language preference
export const saveLanguage = (lang: string): void => {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch {
    // Ignore localStorage errors
  }
}

export default i18n
