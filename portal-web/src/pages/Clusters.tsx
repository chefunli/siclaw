import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Server, Trash2, Loader2, Settings } from "lucide-react"
import { api } from "../api"
import { useToast } from "../components/toast"
import { useConfirm } from "../components/confirm-dialog"

interface Cluster {
  id: string; name: string; description: string; api_server: string; debug_image: string | null; is_production: boolean; created_at: string
}

export function Clusters() {
  const { t } = useTranslation()
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", kubeconfig: "", debug_image: "", is_production: true })
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "", kubeconfig: "", debug_image: "", is_production: true })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const confirmDialog = useConfirm()

  useEffect(() => {
    api<{ data: Cluster[] }>("/clusters").then((r) => setClusters(Array.isArray(r.data) ? r.data : Array.isArray(r) ? r as any : [])).catch(() => setClusters([])).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const payload: Record<string, unknown> = { name: form.name, description: form.description, kubeconfig: form.kubeconfig, is_production: form.is_production }
      if (form.debug_image) payload.debug_image = form.debug_image
      const c = await api<Cluster>("/clusters", { method: "POST", body: payload })
      setClusters((prev) => [...prev, c])
      setShowCreate(false)
      setForm({ name: "", description: "", kubeconfig: "", debug_image: "", is_production: true })
      toast.success(t("common.success"))
    } catch (err: any) { toast.error(err.message) } finally { setCreating(false) }
  }

  const handleDelete = async (c: Cluster) => {
    if (!(await confirmDialog({ title: t("clusters.deleteTitle"), message: t("clusters.deleteMessage", { name: c.name }), destructive: true, confirmLabel: t("common.delete") }))) return
    await api(`/clusters/${c.id}`, { method: "DELETE" })
    setClusters((prev) => prev.filter((x) => x.id !== c.id))
  }

  const startEditCluster = (c: Cluster) => {
    setEditingId(c.id)
    setEditForm({ name: c.name, description: c.description || "", kubeconfig: "", debug_image: c.debug_image || "", is_production: c.is_production })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name: editForm.name, description: editForm.description, is_production: editForm.is_production, debug_image: editForm.debug_image || null }
      if (editForm.kubeconfig) body.kubeconfig = editForm.kubeconfig
      const updated = await api<Cluster>(`/clusters/${editingId}`, { method: "PUT", body })
      setClusters((prev) => prev.map((c) => c.id === editingId ? updated : c))
      setEditingId(null)
      toast.success(t("common.success"))
    } catch (err: any) { toast.error(err.message) } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold">{t("clusters.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("clusters.subtitle")}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> {t("clusters.newCluster")}
        </button>
      </div>

      {showCreate && (
        <div className="mx-6 my-4 p-4 rounded-lg border border-border bg-card space-y-4">
          <div><label className="block text-sm font-medium mb-1">{t("clusters.clusterName")}</label><input placeholder="e.g. prod-us-east" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">{t("common.description")}</label><input placeholder={t("common.optional")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background" /></div>
          <div><label className="block text-sm font-medium mb-1">{t("clusters.kubeconfig")}</label><textarea placeholder={t("clusters.pasteKubeconfig") || "Paste kubeconfig YAML here..."} value={form.kubeconfig} onChange={(e) => setForm({ ...form, kubeconfig: e.target.value })} rows={6} className="w-full px-3 py-2 text-xs font-mono rounded-md border border-border bg-background resize-none" /></div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating || !form.name || !form.kubeconfig} className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50">{creating ? t("common.loading") : t("common.create")}</button>
            <button onClick={() => setShowCreate(false)} className="h-8 px-4 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {clusters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20"><Server className="h-12 w-12 text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">{t("clusters.noClusters")}</p></div>
        ) : (
          <div className="px-6 py-4 space-y-2">
            {clusters.map((c) => (
              <div key={c.id}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono">{c.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.is_production ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{c.is_production ? t("skills.productionShort") : t("skills.devShort")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.api_server || t("clusters.noApiServer")}{c.description ? ` · ${c.description}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditCluster(c)} title={t("common.edit")} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Settings className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(c)} title={t("common.delete")} className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                {editingId === c.id && (
                  <div className="ml-4 mt-2 mb-2 p-4 rounded-lg border border-border bg-card space-y-4">
                    <div><label className="block text-sm font-medium mb-1">{t("clusters.clusterName")}</label><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background" /></div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={saving || !editForm.name} className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50">{saving ? t("common.loading") : t("common.save")}</button>
                      <button onClick={() => setEditingId(null)} className="h-8 px-4 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
