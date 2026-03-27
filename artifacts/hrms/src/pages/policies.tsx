import { useState, useEffect } from "react";
import { Shield, Plus, Loader2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` });

const CATEGORIES = ["Leave Policy", "Attendance", "Code of Conduct", "IT & Security", "Travel & Expenses", "Anti-Harassment", "Work From Home", "Compensation", "General"];

export default function Policies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/policies`, { headers: headers() });
      setPolicies(await resp.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deletePolicy = async (id: number) => {
    if (!confirm("Delete this policy?")) return;
    await fetch(`${BASE}/api/policies/${id}`, { method: "DELETE", headers: headers() });
    fetchAll();
  };

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    policies: policies.filter(p => p.category === cat),
  })).filter(g => g.policies.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Company Policies</h1>
          <p className="text-sm text-muted-foreground">HR policies and guidelines.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Policy
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : grouped.length > 0 ? (
        <div className="space-y-3">
          {grouped.map(g => (
            <div key={g.category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{g.category}</h3>
              <div className="space-y-2">
                {g.policies.map(p => (
                  <div key={p.id} className="glass-card rounded-xl overflow-hidden group">
                    <button 
                      onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                      className="w-full px-4 md:px-5 py-3 md:py-4 flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{p.title}</h4>
                        <p className="text-xs text-muted-foreground">v{p.version} &bull; Updated {formatDate(p.updatedAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deletePolicy(p.id); }}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {expanded === p.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {expanded === p.id && (
                      <div className="px-4 md:px-5 pb-4 md:pb-5 border-t border-border/30 pt-3 md:pt-4">
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">{p.content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">No policies defined yet.</div>
      )}

      <AddPolicyModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchAll(); }} />
    </div>
  );
}

function AddPolicyModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ title: "", category: "General", content: "", version: "1.0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ title: "", category: "General", content: "", version: "1.0" }); setError(""); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError("Title and content are required."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/policies`, { method: "POST", headers: headers(), body: JSON.stringify(form) });
      if (!resp.ok) throw new Error("Failed to create policy");
      onSuccess();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Policy" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" placeholder="e.g. Leave Policy" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Version</label>
            <input type="text" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Content</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" placeholder="Write the policy details..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Policy
          </button>
        </div>
      </form>
    </Modal>
  );
}
