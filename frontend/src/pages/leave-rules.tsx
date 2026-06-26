import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, ToggleLeft, ToggleRight, Clock, AlertTriangle, Zap, Briefcase, Settings2, X, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

const WEEKDAYS = [
  { val: "monday", label: "Mon" },
  { val: "tuesday", label: "Tue" },
  { val: "wednesday", label: "Wed" },
  { val: "thursday", label: "Thu" },
  { val: "friday", label: "Fri" },
  { val: "saturday", label: "Sat" },
  { val: "sunday", label: "Sun" },
];

const EMPTY_FORM = {
  ruleName: "", description: "", isActive: true, appliesTo: "all",
  shiftStart: "09:00", shiftEnd: "18:00", expectedHours: "8.0",
  gracePeriodMinutes: 15, lateThresholdMinutes: 30,
  halfDayEnabled: true, halfDayMaxHours: "4.5", halfDayMinHours: "3.0",
  shortLeaveEnabled: true, shortLeaveMaxHours: "2.0", shortLeaveMaxPerMonth: 2,
  absentIfNoCheckIn: false, absentCheckInCutoff: "",
  overtimeEnabled: false, overtimeThresholdHours: "",
  weekendDays: ["saturday", "sunday"], countHolidaysAsPresent: true,
};

function serializeForm(f: typeof EMPTY_FORM) {
  const weekendDays = Array.isArray(f.weekendDays) ? f.weekendDays.join(",") : f.weekendDays;
  return {
    ...f,
    expectedHours: parseFloat(f.expectedHours as any) || 8,
    halfDayMaxHours: parseFloat(f.halfDayMaxHours as any) || 4.5,
    halfDayMinHours: parseFloat(f.halfDayMinHours as any) || 3,
    shortLeaveMaxHours: parseFloat(f.shortLeaveMaxHours as any) || 2,
    overtimeThresholdHours: f.overtimeThresholdHours ? parseFloat(f.overtimeThresholdHours as any) : null,
    shiftStart: f.shiftStart.includes(":") && !f.shiftStart.endsWith(":00") ? f.shiftStart + ":00" : f.shiftStart,
    shiftEnd: f.shiftEnd.includes(":") && !f.shiftEnd.endsWith(":00") ? f.shiftEnd + ":00" : f.shiftEnd,
    absentCheckInCutoff: f.absentCheckInCutoff || null,
    weekendDays,
  };
}

function formatTime(t: string) {
  if (!t) return "";
  const parts = t.split(":");
  const h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)} className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Chip({ label, color }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors[color || "gray"]}`}>{label}</span>;
}

export default function LeaveRules() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "hr";
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [tab, setTab] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const headers = useCallback((): HeadersInit => {
    const token = localStorage.getItem("hrms_token");
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/leave-rules`, { headers: headers() });
      if (res.ok) setRules(await res.json());
    } catch {}
    setLoading(false);
  }, [headers]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleToggle = async (id: string) => {
    await fetch(`${API}/api/leave-rules/${id}/toggle`, { method: "PATCH", headers: headers() });
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/leave-rules/${id}`, { method: "DELETE", headers: headers() });
    setDeleting(null);
    fetchRules();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setTab(0);
    setShowModal(true);
  };

  const openEdit = (rule: any) => {
    setEditingId(rule._id);
    setForm({
      ruleName: rule.ruleName, description: rule.description || "", isActive: rule.isActive,
      appliesTo: rule.appliesTo || "all",
      shiftStart: rule.shiftStart?.slice(0, 5) || "09:00",
      shiftEnd: rule.shiftEnd?.slice(0, 5) || "18:00",
      expectedHours: String(rule.expectedHours ?? 8),
      gracePeriodMinutes: rule.gracePeriodMinutes ?? 15,
      lateThresholdMinutes: rule.lateThresholdMinutes ?? 30,
      halfDayEnabled: rule.halfDayEnabled ?? true,
      halfDayMaxHours: String(rule.halfDayMaxHours ?? 4.5),
      halfDayMinHours: String(rule.halfDayMinHours ?? 3),
      shortLeaveEnabled: rule.shortLeaveEnabled ?? true,
      shortLeaveMaxHours: String(rule.shortLeaveMaxHours ?? 2),
      shortLeaveMaxPerMonth: rule.shortLeaveMaxPerMonth ?? 2,
      absentIfNoCheckIn: rule.absentIfNoCheckIn ?? false,
      absentCheckInCutoff: rule.absentCheckInCutoff?.slice(0, 5) || "",
      overtimeEnabled: rule.overtimeEnabled ?? false,
      overtimeThresholdHours: rule.overtimeThresholdHours ? String(rule.overtimeThresholdHours) : "",
      weekendDays: (rule.weekendDays || "saturday,sunday").split(","),
      countHolidaysAsPresent: rule.countHolidaysAsPresent ?? true,
    });
    setTab(0);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const body = serializeForm(form);
    if (editingId) {
      await fetch(`${API}/api/leave-rules/${editingId}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) });
    } else {
      await fetch(`${API}/api/leave-rules`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
    }
    setShowModal(false);
    fetchRules();
  };

  const toggleWeekend = (day: string) => {
    const current = form.weekendDays as string[];
    setForm({ ...form, weekendDays: current.includes(day) ? current.filter((d) => d !== day) : [...current, day] });
  };

  const total = rules.length;
  const active = rules.filter((r) => r.isActive).length;
  const halfDayRules = rules.filter((r) => r.halfDayEnabled).length;
  const shortLeaveRules = rules.filter((r) => r.shortLeaveEnabled).length;
  const summaryCards = [
    { label: "Total Rules", value: total, color: "from-blue-500 to-blue-600" },
    { label: "Active", value: active, color: "from-green-500 to-green-600" },
    { label: "Half-Day Rules", value: halfDayRules, color: "from-amber-500 to-amber-600" },
    { label: "Short-Leave Rules", value: shortLeaveRules, color: "from-purple-500 to-purple-600" },
  ];

  const TABS = ["Shift & Timing", "Half-Day", "Short Leave", "Other"];

  const Modal = () => (
    <AnimatePresence>
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold">{editingId ? "Edit Rule" : "New Attendance Rule"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === i ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>{t}</button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              {tab === 0 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="text-sm font-medium">Rule Name</label><input value={form.ruleName} onChange={(e) => setForm({ ...form, ruleName: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div className="col-span-2"><label className="text-sm font-medium">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div><label className="text-sm font-medium">Shift Start</label><input type="time" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div><label className="text-sm font-medium">Shift End</label><input type="time" value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div><label className="text-sm font-medium">Expected Hours/Day</label><input type="number" step="0.1" value={form.expectedHours} onChange={(e) => setForm({ ...form, expectedHours: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div><label className="text-sm font-medium">Grace Period (min)</label><input type="number" value={form.gracePeriodMinutes} onChange={(e) => setForm({ ...form, gracePeriodMinutes: parseInt(e.target.value) || 0 })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div><label className="text-sm font-medium">Late Threshold (min)</label><input type="number" value={form.lateThresholdMinutes} onChange={(e) => setForm({ ...form, lateThresholdMinutes: parseInt(e.target.value) || 0 })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    <div>
                      <label className="text-sm font-medium">Applies To</label>
                      <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent">
                        <option value="all">All Employees</option>
                        <option value="permanent">Permanent</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Toggle enabled={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                </>
              )}

              {tab === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Toggle enabled={form.halfDayEnabled} onChange={(v) => setForm({ ...form, halfDayEnabled: v })} />
                    <span className="font-medium">Enable Half-Day Detection</span>
                  </div>
                  {form.halfDayEnabled && (
                    <div className="grid grid-cols-2 gap-4 ml-8">
                      <div><label className="text-sm font-medium">Min Hours (below = Absent)</label><input type="number" step="0.1" value={form.halfDayMinHours} onChange={(e) => setForm({ ...form, halfDayMinHours: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                      <div><label className="text-sm font-medium">Max Hours (above = Present)</label><input type="number" step="0.1" value={form.halfDayMaxHours} onChange={(e) => setForm({ ...form, halfDayMaxHours: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    </div>
                  )}
                  <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                    <strong>Logic:</strong> Worked hours &lt; {form.halfDayMinHours}h = Absent | {form.halfDayMinHours}h–{form.halfDayMaxHours}h = Half Day | &gt; {form.halfDayMaxHours}h = Present
                  </div>
                </>
              )}

              {tab === 2 && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Toggle enabled={form.shortLeaveEnabled} onChange={(v) => setForm({ ...form, shortLeaveEnabled: v })} />
                    <span className="font-medium">Enable Short-Leave Tracking</span>
                  </div>
                  {form.shortLeaveEnabled && (
                    <div className="grid grid-cols-2 gap-4 ml-8">
                      <div><label className="text-sm font-medium">Max Hours Per Instance</label><input type="number" step="0.1" value={form.shortLeaveMaxHours} onChange={(e) => setForm({ ...form, shortLeaveMaxHours: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                      <div><label className="text-sm font-medium">Max Per Month</label><input type="number" value={form.shortLeaveMaxPerMonth} onChange={(e) => setForm({ ...form, shortLeaveMaxPerMonth: parseInt(e.target.value) || 0 })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                    </div>
                  )}
                  {form.shortLeaveEnabled && (
                    <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-sm text-purple-700 dark:text-purple-300">
                      <strong>Logic:</strong> Absence hours ≤ {form.shortLeaveMaxHours}h and count &lt; {form.shortLeaveMaxPerMonth}/mo → Short Leave (not Absent)
                    </div>
                  )}
                </>
              )}

              {tab === 3 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Weekend Days</label>
                    <div className="flex gap-2">
                      {WEEKDAYS.map((d) => (
                        <button key={d.val} onClick={() => toggleWeekend(d.val)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${(form.weekendDays as string[]).includes(d.val) ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-gray-300 dark:border-gray-700"}`}>{d.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle enabled={form.absentIfNoCheckIn} onChange={(v) => setForm({ ...form, absentIfNoCheckIn: v })} />
                    <span className="text-sm font-medium">Auto-Absent if no check-in</span>
                  </div>
                  {form.absentIfNoCheckIn && (
                    <div className="ml-8"><label className="text-sm font-medium">Cutoff Time</label><input type="time" value={form.absentCheckInCutoff} onChange={(e) => setForm({ ...form, absentCheckInCutoff: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                  )}
                  <div className="flex items-center gap-3">
                    <Toggle enabled={form.overtimeEnabled} onChange={(v) => setForm({ ...form, overtimeEnabled: v })} />
                    <span className="text-sm font-medium">Overtime Tracking</span>
                  </div>
                  {form.overtimeEnabled && (
                    <div className="ml-8"><label className="text-sm font-medium">Threshold Hours/Day</label><input type="number" step="0.1" value={form.overtimeThresholdHours} onChange={(e) => setForm({ ...form, overtimeThresholdHours: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent" /></div>
                  )}
                  <div className="flex items-center gap-3">
                    <Toggle enabled={form.countHolidaysAsPresent} onChange={(v) => setForm({ ...form, countHolidaysAsPresent: v })} />
                    <span className="text-sm font-medium">Count Holidays as Present</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-700">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground flex items-center gap-2"><Save className="w-4 h-4" /> {editingId ? "Update" : "Create"}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Rules</h1>
          <p className="text-muted-foreground text-sm">Define policies for attendance, late, half-day, and short-leave detection</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-4 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No attendance rules defined yet.</p>
          {isAdmin && <button onClick={openCreate} className="mt-3 text-primary hover:underline text-sm">Create your first rule</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const isExpanded = expanded[rule._id];
            const chips: { label: string; color: string }[] = [];
            chips.push({ label: `${formatTime(rule.shiftStart)} – ${formatTime(rule.shiftEnd)}`, color: "gray" });
            chips.push({ label: `${rule.gracePeriodMinutes}m grace`, color: "green" });
            if (rule.halfDayEnabled) chips.push({ label: `Half-day: ${rule.halfDayMinHours}–${rule.halfDayMaxHours}h`, color: "amber" });
            if (rule.shortLeaveEnabled) chips.push({ label: `Short ≤${rule.shortLeaveMaxHours}h, max ${rule.shortLeaveMaxPerMonth}/mo`, color: "purple" });
            if (rule.overtimeEnabled) chips.push({ label: `OT after ${rule.overtimeThresholdHours}h`, color: "blue" });

            return (
              <div key={rule._id} className="glass-card rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <button onClick={() => setExpanded({ ...expanded, [rule._id]: !isExpanded })} className="flex items-center gap-3 flex-1 text-left">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{rule.ruleName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${rule.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>{rule.isActive ? "Active" : "Inactive"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {chips.map((c, i) => <Chip key={i} label={c.label} color={c.color} />)}
                      </div>
                    </div>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggle(rule._id)} className="p-2 rounded-lg hover:bg-secondary/80" title="Toggle active">{rule.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}</button>
                      <button onClick={() => openEdit(rule)} className="p-2 rounded-lg hover:bg-secondary/80"><Pencil className="w-4 h-4" /></button>
                      {deleting === rule._id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(rule._id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-medium">Confirm</button>
                          <button onClick={() => setDeleting(null)} className="p-2 rounded-lg hover:bg-secondary/80"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleting(rule._id)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Detail Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/50">
                      <div className="grid grid-cols-4 gap-6 p-4 text-sm">
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Shift & Timing</h4>
                          <div className="space-y-2">
                            <div><span className="text-muted-foreground">Start:</span> {formatTime(rule.shiftStart)}</div>
                            <div><span className="text-muted-foreground">End:</span> {formatTime(rule.shiftEnd)}</div>
                            <div><span className="text-muted-foreground">Expected:</span> {rule.expectedHours}h</div>
                            <div><span className="text-muted-foreground">Grace:</span> {rule.gracePeriodMinutes}m</div>
                            <div><span className="text-muted-foreground">Late threshold:</span> {rule.lateThresholdMinutes}m</div>
                            <div><span className="text-muted-foreground">Applies to:</span> {rule.appliesTo}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Half-Day</h4>
                          <div className="space-y-2">
                            <div><span className="text-muted-foreground">Enabled:</span> {rule.halfDayEnabled ? "Yes" : "No"}</div>
                            {rule.halfDayEnabled && (
                              <>
                                <div><span className="text-muted-foreground">Min (Absent):</span> {rule.halfDayMinHours}h</div>
                                <div><span className="text-muted-foreground">Max (Present):</span> {rule.halfDayMaxHours}h</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Short Leave</h4>
                          <div className="space-y-2">
                            <div><span className="text-muted-foreground">Enabled:</span> {rule.shortLeaveEnabled ? "Yes" : "No"}</div>
                            {rule.shortLeaveEnabled && (
                              <>
                                <div><span className="text-muted-foreground">Max hours:</span> {rule.shortLeaveMaxHours}h</div>
                                <div><span className="text-muted-foreground">Max/month:</span> {rule.shortLeaveMaxPerMonth}</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Other</h4>
                          <div className="space-y-2">
                            <div><span className="text-muted-foreground">Weekends:</span> {(rule.weekendDays || "").split(",").map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")}</div>
                            <div><span className="text-muted-foreground">Overtime:</span> {rule.overtimeEnabled ? `Yes (≥${rule.overtimeThresholdHours}h)` : "No"}</div>
                            <div><span className="text-muted-foreground">Auto-absent:</span> {rule.absentIfNoCheckIn ? `Yes (cutoff ${rule.absentCheckInCutoff || "N/A"})` : "No"}</div>
                            <div><span className="text-muted-foreground">Holidays count:</span> {rule.countHolidaysAsPresent ? "Present" : "No"}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <Modal />
    </div>
  );
}
