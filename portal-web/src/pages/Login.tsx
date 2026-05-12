import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { api, setToken } from "../api"
import { saveLanguage } from "../i18n"

export function Login() {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: { username, password },
      })
      setToken(res.token)
      navigate("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    saveLanguage(lang)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-[360px] p-8 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">{t("layout.title")}</h1>
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <select
              value={i18n.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-xs bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
            >
              <option value="zh-CN">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("login.subtitle") || t("login.signInToContinue")}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t("login.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
          <input
            type="password"
            placeholder={t("login.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  )
}
