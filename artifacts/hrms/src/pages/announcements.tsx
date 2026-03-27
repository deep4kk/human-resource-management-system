import { useState, useEffect } from "react";
import { Megaphone, Plus, Loader2, Trash2, AlertTriangle, Info, Bell as BellIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` });

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/announcements`, { headers: headers() });
      setAnnouncements(await resp.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteAnn = async (id: number) => {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`${BASE}/api/announcements/${id}`, { method: "DELETE", headers: headers() });
    fetchAll();
  };

  const priorityIcons: Record<string, any> = { urgent: AlertTriangle, high: BellIcon, normal: Info, low: Megaphone };
  const priorityColors: Record<string, string> = { urgent: "bg-destructive/10 text-destructive border-destructive/20", high: "bg-amber-500/10 text-amber-600 border-amber-500/20", normal: "bg-primary/10 text-primary border-primary/20", low: "bg-secondary text-muted-foreground border-border" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Company-wide notices and updates.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map(ann => {
            const Icon = priorityIcons[ann.priority] || Info;
            const color = priorityColors[ann.priority] || priorityColors.normal;
            return (
              <div key={ann.id} className={`glass-card rounded-2xl p-5 md:p-6 border-l-4 ${color.split(' ').pop()} group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${color.split(' ').slice(0, 2).join(' ')} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base md:text-lg">{ann.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${color}`}>{ann.priority}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(ann.createdAt)}</span>
                          {ann.targetRoles !== "all" && <span className="text-xs text-muted-foreground">For: {ann.targetRoles}</span>}
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteAnn(ann.id)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">No announcements yet.</div>
      )}

      <AddAnnouncementModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchAll(); }} />
    </div>
  );
}

function AddAnnouncementModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ title: "", content: "", priority: "normal", targetRoles: "all" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ title: "", content: "", priority: "normal", targetRoles: "all" }); setError(""); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError("Title and content are required."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/announcements`, { method: "POST", headers: headers(), body: JSON.stringify(form) });
      if (!resp.ok) throw new Error("Failed to create announcement");
      onSuccess();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="New Announcement" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" placeholder="e.g. Office will remain closed on..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target Audience</label>
            <select value={form.targetRoles} onChange={e => setForm(f => ({ ...f, targetRoles: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="all">All Employees</option>
              <option value="admin,hr">Admin & HR Only</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees Only</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Content</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" placeholder="Write your announcement..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Publish
          </button>
        </div>
      </form>
    </Modal>
  );
}
