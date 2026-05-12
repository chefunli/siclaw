import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { saveLanguage } from "../i18n"

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    saveLanguage(lang)
  }

  const currentLang = i18n.language

  return (
    <div className="flex items-center gap-1">
      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="text-xs bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
        aria-label={t("layout.language")}
      >
        <option value="en">{t("layout.english")}</option>
        <option value="zh-CN">{t("layout.chinese")}</option>
      </select>
    </div>
  )
}
