import { useCallback, useMemo, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLive, useSummary, useTimingStats, useUsers } from "../hooks/useMetrics"
import { KpiCards } from "../components/metrics/KpiCards"
import { RankedTable } from "../components/metrics/RankedTable"
import { TimingStatsCard } from "../components/metrics/TimingStatsCard"
import { AuditTable } from "../components/metrics/AuditTable"
import { GrafanaFrame } from "../components/metrics/GrafanaFrame"

type TabKey = "dashboard" | "audit" | "grafana"

export function Metrics() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>("dashboard")
  const [userId, setUserId] = useState<string>("")         // "" = All Users
  const [period, setPeriod] = useState<"today" | "7d" | "30d">("7d")

  const filterUserId = userId || null

  const { users } = useUsers()
  const { data: live, loading: liveLoading, refresh: refreshLive } = useLive(filterUserId)
  const { data: summary, loading: summaryLoading, refresh: refreshSummary } = useSummary(period, filterUserId)
  const { data: timing, refresh: refreshTiming } = useTimingStats(period, filterUserId)

  const [spinning, setSpinning] = useState(false)
  const handleRefresh = useCallback(() => {
    setSpinning(true)
    Promise.all([refreshLive(), refreshSummary(), refreshTiming()]).finally(() => {
      setTimeout(() => setSpinning(false), 600)
    })
  }, [refreshLive, refreshSummary, refreshTiming])

  const selectedUsername = useMemo(() => {
    if (!userId) return null
    return users.find((u) => u.id === userId)?.username ?? userId
  }, [userId, users])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t("metrics.title")}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{t("metrics.runtimeTelemetry")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                {t("metrics.liveAutoRefresh")}
              </div>
              {tab === "dashboard" && (
                <button
                  onClick={handleRefresh}
                  title={t("metrics.syncNow")}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 transition-transform duration-500 ${spinning ? "animate-spin" : ""}`} />
                </button>
              )}
              <div className="w-px h-4 bg-border mx-2"></div>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-8 px-2 pr-6 text-[12px] rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="">{t("metrics.allUsers")}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "today" | "7d" | "30d")}
                className="h-8 px-2 pr-6 text-[12px] rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="today">{t("metrics.today")}</option>
                <option value="7d">{t("metrics.last7Days")}</option>
                <option value="30d">{t("metrics.last30Days")}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 -mb-px">
            {(["dashboard", "audit", "grafana"] as TabKey[]).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`py-2.5 px-1 text-[13px] font-medium border-b-2 transition-colors ${
                  tab === tabKey
                    ? "text-foreground border-blue-500"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {tabKey === "dashboard" ? t("metrics.dashboard") : tabKey === "audit" ? t("metrics.audit") : t("metrics.grafana")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "dashboard" && (
          <section className="px-6 py-6 space-y-6">
            {liveLoading || summaryLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <KpiCards
                  totalSessions={summary?.totalSessions ?? 0}
                  totalPrompts={summary?.totalPrompts ?? 0}
                  activeSessions={live?.snapshot.activeSessions ?? 0}
                  wsConnections={live?.snapshot.wsConnections ?? 0}
                  toolCallsTotal={(live?.topTools ?? []).reduce((s, t) => s + t.total, 0)}
                  period={period}
                />

                <TimingStatsCard data={timing} period={period} />

                <div className="grid grid-cols-2 gap-4">
                  <RankedTable
                    title={t("metrics.topTools")}
                    subtitle={t("metrics.byInvocationCount")}
                    items={(live?.topTools ?? []).map((tool) => ({
                      name: tool.toolName,
                      subtitle: tool.agentId ? t("metrics.agentWithId", { agentId: tool.agentId }) : undefined,
                      total: tool.total,
                      success: tool.success,
                      error: tool.error,
                    }))}
                  />
                  <RankedTable
                    title={t("metrics.topSkills")}
                    subtitle={t("metrics.byInvocationAvg")}
                    items={(live?.topSkills ?? []).map((s) => ({
                      name: s.skillName,
                      subtitle: t("metrics.scopeAvgMs", { scope: s.scope, avgMs: s.avgDurationMs }),
                      total: s.total,
                      success: s.success,
                      error: s.error,
                    }))}
                  />
                </div>

                {!filterUserId && summary && summary.byUser.length > 0 && (
                  <RankedTable
                    title={t("metrics.byUser")}
                    subtitle={t("metrics.sessionsMessages", { period })}
                    items={summary.byUser.map((u) => {
                      const username = users.find((x) => x.id === u.userId)?.username ?? u.userId
                      return {
                        name: username,
                        subtitle: `${u.messages} ${t("metrics.messages")}`,
                        total: u.sessions,
                        success: u.sessions,
                        error: 0,
                      }
                    })}
                  />
                )}
              </>
            )}
          </section>
        )}

        {tab === "audit" && (
          <AuditTable userFilterId={filterUserId} usernameHint={selectedUsername} />
        )}

        {tab === "grafana" && <GrafanaFrame />}
      </div>
    </div>
  )
}
