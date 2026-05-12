import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Users as UsersIcon, Trash2, Loader2, Settings } from "lucide-react"
import { api } from "../api"
import { useToast } from "../components/toast"
import { useConfirm } from "../components/confirm-dialog"

interface User {
  id: string
  username: string
  role: string
  can_review_skills: boolean | number
  created_at: string
}

export function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ username: "", password: "", can_review_skills: false })
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ can_review_skills: false, password: "" })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const confirmDialog = useConfirm()

  const loadUsers = () => {
    api<{ data: User[] }>("/users")
      .then((r) => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch((err) => {
        setUsers([])
        if (err.message?.includes("403") || err.message?.includes("Admin")) {
          toast.error(t("users.sessionExpired"))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const u = await api<User>("/users", { method: "POST", body: form })
      setUsers((prev) => [...prev, u])
      setShowCreate(false)
      setForm({ username: "", password: "", can_review_skills: false })
      toast.success(t("common.success"))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (u: User) => {
    if (!(await confirmDialog({
      title: t("users.deleteTitle"),
      message: t("users.deleteMessage", { username: u.username }),
      destructive: true,
      confirmLabel: t("common.delete"),
    }))) return
    try {
      await api(`/users/${u.id}`, { method: "DELETE" })
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      toast.success(t("common.success"))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const startEdit = (u: User) => {
    setEditingId(u.id)
    setEditForm({ can_review_skills: !!u.can_review_skills, password: "" })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const user = users.find((u) => u.id === editingId)
    if (!user) return
    setSaving(true)
    try {
      if (user.role !== "admin") {
        const updated = await api<User>(`/users/${editingId}`, {
          method: "PUT",
          body: { can_review_skills: editForm.can_review_skills },
        })
        setUsers((prev) => prev.map((x) => x.id === editingId ? updated : x))
      }

      if (editForm.password.trim()) {
        await api(`/users/${editingId}/password`, {
          method: "PUT",
          body: { password: editForm.password },
        })
      }

      setEditingId(null)
      toast.success(t("common.success"))
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-lg font-semibold">{t("users.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("users.subtitle")}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 h-8 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-3.5 w-3.5" /> {t("users.addUser")}
        </button>
      </div>

      {showCreate && (
        <div className="mx-6 my-4 p-4 rounded-lg border border-border bg-card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("users.username")}</label>
              <input placeholder="e.g. alice" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("users.password")}</label>
              <input type="password" placeholder={t("users.initialPassword")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <button type="button" role="switch" aria-checked={form.can_review_skills} onClick={() => setForm({ ...form, can_review_skills: !form.can_review_skills })} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors mt-0.5 ${form.can_review_skills ? "bg-primary" : "bg-muted"}`}>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.can_review_skills ? "translate-x-4" : "translate-x-0"}`} />
            </button>
            <div>
              <label className="block text-sm font-medium">{t("users.skillReviewer")}</label>
              <p className="text-xs text-muted-foreground">{t("users.skillReviewerDesc")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating || !form.username || !form.password} className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50">{creating ? t("common.loading") : t("common.create")}</button>
            <button onClick={() => setShowCreate(false)} className="h-8 px-4 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground">{t("common.cancel")}</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UsersIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t("users.noUsers")}</p>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-2">
            {users.map((u) => (
              <div key={u.id}>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground text-sm font-medium">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{u.username}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${u.role === "admin" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {u.role === "admin" ? t("users.admin").toUpperCase() : t("users.user").toUpperCase()}
                        </span>
                        {!!u.can_review_skills && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">{t("users.reviewer").toUpperCase()}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{t("users.created")} {new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(u)} title={t("common.edit")} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <Settings className="h-4 w-4" />
                    </button>
                    {u.role !== "admin" && (
                      <button onClick={() => handleDelete(u)} title={t("common.delete")} className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {editingId === u.id && (
                  <div className="ml-4 mt-2 mb-2 p-4 rounded-lg border border-border bg-card space-y-4">
                    {u.role !== "admin" && (
                      <div className="flex items-start gap-3">
                        <button type="button" role="switch" aria-checked={editForm.can_review_skills} onClick={() => setEditForm({ ...editForm, can_review_skills: !editForm.can_review_skills })} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors mt-0.5 ${editForm.can_review_skills ? "bg-primary" : "bg-muted"}`}>
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${editForm.can_review_skills ? "translate-x-4" : "translate-x-0"}`} />
                        </button>
                        <div>
                          <label className="block text-sm font-medium">{t("users.skillReviewer")}</label>
                          <p className="text-xs text-muted-foreground">{t("users.skillReviewerDesc")}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t("users.resetPassword")}</label>
                      <input
                        type="password"
                        placeholder={t("users.leaveEmptyPassword")}
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={saving} className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50">{saving ? t("common.loading") : t("common.save")}</button>
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
