import { useState, useEffect } from "react";
import { CalendarHeart, Plus, Loader2, Trash2, Gift, Sun, Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` });

export default function Holidays() {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/holidays?year=${year}`, { headers: headers() });
      setHolidays(await resp.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchHolidays(); }, [year]);

  const deleteHoliday = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;
    await fetch(`${BASE}/api/holidays/${id}`, { method: "DELETE", headers: headers() });
    fetchHolidays();
  };

  const typeIcons: Record<string, any> = { public: Gift, national: Star, religious: Sun, optional: CalendarHeart };
  const typeColors: Record<string, string> = { public: "bg-primary/10 text-primary", national: "bg-amber-500/10 text-amber-600", religious: "bg-purple-500/10 text-purple-600", optional: "bg-emerald-500/10 text-emerald-600" };

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const grouped = months.map((m, i) => ({ month: m, holidays: holidays.filter(h => new Date(h.date).getMonth() === i) })).filter(g => g.holidays.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Holidays</h1>
          <p className="text-sm text-muted-foreground">Company holiday calendar for {year}.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="h-9 px-3 rounded-xl border border-border bg-background text-sm">
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : grouped.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(g => (
            <div key={g.month}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{g.month}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.holidays.map(h => {
                  const Icon = typeIcons[h.type] || Gift;
                  const color = typeColors[h.type] || typeColors.public;
                  const dayName = new Date(h.date).toLocaleDateString('en-IN', { weekday: 'long' });
                  return (
                    <div key={h.id} className="glass-card rounded-xl p-4 flex items-center gap-3 group">
                      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{h.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(h.date)} &bull; {dayName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {h.isOptional && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">Optional</span>}
                        {isAdmin && (
                          <button onClick={() => deleteHoliday(h.id)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">No holidays found for {year}.</div>
      )}

      <div className="glass-card rounded-2xl p-5 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-muted-foreground">Legend:</span>
        {Object.entries(typeColors).map(([type, cls]) => {
          const Icon = typeIcons[type] || Gift;
          return (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div className={`w-6 h-6 rounded-lg ${cls} flex items-center justify-center`}><Icon className="w-3 h-3" /></div>
              <span className="capitalize">{type}</span>
            </div>
          );
        })}
        <div className="ml-auto text-sm font-bold text-primary">{holidays.length} holidays in {year}</div>
      </div>

      <AddHolidayModal open={showAdd} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchHolidays(); }} />
    </div>
  );
}

function AddHolidayModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ name: "", date: "", type: "public", isOptional: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ name: "", date: "", type: "public", isOptional: false }); setError(""); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date) { setError("Name and date are required."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/holidays`, { method: "POST", headers: headers(), body: JSON.stringify(form) });
      if (!resp.ok) throw new Error("Failed to add holiday");
      onSuccess();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Holiday">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Holiday Name</label>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" placeholder="e.g. Republic Day" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="public">Public</option>
              <option value="national">National</option>
              <option value="religious">Religious</option>
              <option value="optional">Optional</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isOptional} onChange={e => setForm(f => ({ ...f, isOptional: e.target.checked }))} className="w-4 h-4 rounded border-border text-primary" />
          <span className="text-sm font-medium">Optional Holiday</span>
        </label>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add Holiday
          </button>
        </div>
      </form>
    </Modal>
  );
}
