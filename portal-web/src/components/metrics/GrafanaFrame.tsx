import { useState } from "react"
import { Loader2, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSystemConfig } from "../../hooks/useMetrics"
import { useToast } from "../toast"

const KEY = "system.grafanaUrl"

export function GrafanaFrame() {
  const { t } = useTranslation()
  const { config, loading, save } = useSystemConfig()
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const grafanaUrl = config[KEY] ?? ""

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSave = async () => {
    const trimmed = input.trim()
    if (!trimmed) { toast.error(t("metrics.urlCannotBeEmpty")); return }
    try {
      const u = new URL(trimmed)
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        toast.error(t("metrics.urlMustStartWithHttp"))
        return
      }
    } catch {
      toast.error(t("metrics.invalidUrlFormat"))
      return
    }
    setSaving(true)
    try {
      await save(KEY, trimmed)
      toast.success(t("metrics.grafanaUrlSaved"))
      setEditing(false)
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // Empty state — no URL configured
  if (!grafanaUrl && !editing) {
    return (
      <section className="px-6 py-6">
        <div className="border border-border rounded-lg bg-card p-10 text-center">
          <h3 className="text-[14px] font-semibold mb-2">{t("metrics.grafanaNotConfigured")}</h3>
          <p className="text-[12px] text-muted-foreground mb-5 max-w-md mx-auto">
            {t("metrics.grafanaNotConfiguredDesc")}
          </p>
          <button
            onClick={() => { setInput(""); setEditing(true) }}
            className="px-4 py-1.5 text-[12px] rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium"
          >
            {t("metrics.configureGrafanaUrl")}
          </button>
        </div>
      </section>
    )
  }

  // Edit mode
  if (editing) {
    return (
      <section className="px-6 py-6">
        <div className="border border-border rounded-lg bg-card p-6 max-w-xl mx-auto">
          <h3 className="text-[13px] font-semibold mb-1">{t("metrics.grafanaUrlLabel")}</h3>
          <p className="text-[11px] text-muted-foreground mb-4">
            {t("metrics.grafanaUrlDesc")}
          </p>
          <input
            type="url"
            value={input || grafanaUrl}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://grafana.internal/d/siclaw-runtime"
            className="w-full h-9 px-3 text-[12px] rounded-md bg-secondary border border-border text-foreground font-mono focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-3 py-1.5 text-[12px] rounded-md border border-border hover:bg-secondary text-muted-foreground"
            >
              {t("metrics.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[12px] rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {t("metrics.save")}
            </button>
          </div>
        </div>
      </section>
    )
  }

  // iframe view
  return (
    <section className="px-6 py-6">
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-[13px] font-semibold">{t("metrics.grafanaDashboard")}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate max-w-md">{grafanaUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={grafanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] px-2 py-1 border border-border rounded hover:bg-secondary text-muted-foreground"
            >
              <ExternalLink className="w-3 h-3" /> {t("metrics.open")}
            </a>
            <button
              onClick={() => { setInput(grafanaUrl); setEditing(true) }}
              className="text-[11px] px-2 py-1 border border-border rounded hover:bg-secondary text-muted-foreground"
            >
              {t("metrics.editUrl")}
            </button>
          </div>
        </div>
        <iframe
          src={grafanaUrl}
          title={t("metrics.grafanaDashboard")}
          className="w-full h-[800px] border-0 bg-black"
          // NOTE: omitting allow-same-origin makes iframe XSS-safe even if URL is
          // javascript: or attacker-controlled. Grafana public share URLs work with just allow-scripts.
          sandbox="allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  )
}
