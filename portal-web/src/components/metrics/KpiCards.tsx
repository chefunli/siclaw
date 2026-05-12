import { MessageSquare, Bot, Activity, Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Props {
  totalSessions: number
  totalPrompts: number
  activeSessions: number
  wsConnections: number
  toolCallsTotal: number
  period: "today" | "7d" | "30d"
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return String(n)
}

export function KpiCards(p: Props) {
  const { t } = useTranslation()
  const periodLabels = {
    today: t("metrics.todayLabel"),
    "7d": t("metrics.last7daysLabel"),
    "30d": t("metrics.last30daysLabel"),
  }
  const plabel = periodLabels[p.period]
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <KpiCard
        label={`${t("metrics.sessions")} · ${plabel}`}
        value={fmt(p.totalSessions)}
        hint={`${t("metrics.activeNow")} · ${p.activeSessions}`}
        icon={<Activity className="h-3.5 w-3.5" style={{ color: "#fbbf24" }} />}
        accent="#fbbf24"
      />
      <KpiCard
        label={`${t("metrics.prompts")} · ${plabel}`}
        value={fmt(p.totalPrompts)}
        hint={t("metrics.userMessages")}
        icon={<MessageSquare className="h-3.5 w-3.5" style={{ color: "#34d399" }} />}
        accent="#34d399"
      />
      <KpiCard
        label={`${t("metrics.toolCalls")} · ${t("metrics.live")}`}
        value={fmt(p.toolCallsTotal)}
        hint={t("metrics.topNTotal")}
        icon={<Wrench className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />}
        accent="#a78bfa"
      />
      <KpiCard
        label={`${t("metrics.wsConnections")} · ${t("metrics.live")}`}
        value={String(p.wsConnections)}
        hint={t("metrics.connectedClients")}
        icon={<Bot className="h-3.5 w-3.5" style={{ color: "#60a5fa" }} />}
        accent="#60a5fa"
      />
    </div>
  )
}

function KpiCard({ label, value, hint, icon, accent }: { label: string; value: string; hint: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card transition-colors hover:border-muted-foreground/40">
      <div className="flex items-start justify-between">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold font-mono" style={{ color: accent }}>{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  )
}
