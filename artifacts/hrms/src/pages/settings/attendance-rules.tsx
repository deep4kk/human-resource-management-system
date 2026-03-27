import { useState, useEffect } from "react";
import { Settings, Clock, Timer, AlertTriangle, ToggleLeft, ToggleRight, Save, Loader2, RefreshCw, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` });

interface AttendanceSettings {
  lateRuleEnabled: boolean;
  lateAfterTime: string;
  graceMinutes: number;
  allowedLates: number;
  penaltyType: string;
  penaltyValue: number;
  workingHoursEnabled: boolean;
  fullDayHours: number;
  halfDayThreshold: number;
  absentThreshold: number;
  shiftEnabled: boolean;
  shiftStartTime: string;
  shiftEndTime: string;
  autoRegularizationEnabled: boolean;
  autoApproveBelowMinutes: number;
}

interface FeatureFlags {
  late_rule: boolean;
  working_hours_rule: boolean;
  shift_rule: boolean;
  auto_regularization: boolean;
}

export default function AttendanceRulesSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFlags, setSavingFlags] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/attendance-settings`, { headers: headers() });
      const data = await resp.json();
      setSettings(data.settings);
      setFlags(data.flags);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess("");
    try {
      const resp = await fetch(`${BASE}/api/attendance-settings`, {
        method: "PUT", headers: headers(),
        body: JSON.stringify(settings),
      });
      if (resp.ok) { setSuccess("Settings saved successfully!"); setTimeout(() => setSuccess(""), 3000); }
    } catch {}
    setSaving(false);
  };

  const handleToggleFlag = async (key: keyof FeatureFlags) => {
    if (!flags) return;
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    setSavingFlags(true);
    try {
      await fetch(`${BASE}/api/attendance-settings/flags`, {
        method: "PUT", headers: headers(),
        body: JSON.stringify({ flags: updated }),
      });
    } catch {}
    setSavingFlags(false);
  };

  const updateSetting = <K extends keyof AttendanceSettings>(key: K, value: AttendanceSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading || !settings || !flags) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const Toggle = ({ enabled, onChange, label, description }: { enabled: boolean; onChange: () => void; label: string; description: string }) => (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={onChange}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {enabled ? (
        <ToggleRight className="w-7 h-7 text-primary shrink-0" />
      ) : (
        <ToggleLeft className="w-7 h-7 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Attendance Rules</h1>
          <p className="text-sm text-muted-foreground">Configure attendance engine rules and feature toggles.</p>
        </div>
        <button onClick={handleSaveSettings} disabled={saving} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2 w-max disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All Settings
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-medium flex items-center gap-2">
          <Zap className="w-4 h-4" /> {success}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 md:p-6">
        <h3 className="font-semibold text-base flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-primary" /> Feature Toggles</h3>
        <p className="text-xs text-muted-foreground mb-4">Enable or disable entire rule modules. Disabled features are completely invisible and have zero performance impact.</p>
        <div className="space-y-2">
          <Toggle enabled={flags.late_rule} onChange={() => handleToggleFlag("late_rule")} label="Late Rule Engine" description="Detect late arrivals and apply penalties after threshold" />
          <Toggle enabled={flags.working_hours_rule} onChange={() => handleToggleFlag("working_hours_rule")} label="Working Hours Rule" description="Auto-determine Present / Half Day / Absent based on hours worked" />
          <Toggle enabled={flags.shift_rule} onChange={() => handleToggleFlag("shift_rule")} label="Shift Timing" description="Enforce shift start/end times" />
          <Toggle enabled={flags.auto_regularization} onChange={() => handleToggleFlag("auto_regularization")} label="Auto Regularization" description="Auto-approve minor lates below a threshold" />
        </div>
      </div>

      {flags.shift_rule && (
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-primary" /> Shift Timings</h3>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.shiftEnabled} onChange={e => updateSetting("shiftEnabled", e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm font-medium">Enable shift enforcement</span>
            </label>
          </div>
          {settings.shiftEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Shift Start Time</label>
                <input type="time" value={settings.shiftStartTime} onChange={e => updateSetting("shiftStartTime", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Shift End Time</label>
                <input type="time" value={settings.shiftEndTime} onChange={e => updateSetting("shiftEndTime", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
              </div>
            </div>
          )}
        </div>
      )}

      {flags.late_rule && (
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-amber-500" /> Late Rule Configuration</h3>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.lateRuleEnabled} onChange={e => updateSetting("lateRuleEnabled", e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm font-medium">Enable late detection</span>
            </label>
          </div>
          {settings.lateRuleEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Late After Time</label>
                <input type="time" value={settings.lateAfterTime} onChange={e => updateSetting("lateAfterTime", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
                <p className="text-[10px] text-muted-foreground">Employees arriving after this are considered late</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Grace Period (minutes)</label>
                <input type="number" value={settings.graceMinutes} onChange={e => updateSetting("graceMinutes", parseInt(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={60} />
                <p className="text-[10px] text-muted-foreground">Extra minutes before marking as late</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Allowed Lates / Month</label>
                <input type="number" value={settings.allowedLates} onChange={e => updateSetting("allowedLates", parseInt(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={30} />
                <p className="text-[10px] text-muted-foreground">Penalty kicks in after this many</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Penalty Type</label>
                <select value={settings.penaltyType} onChange={e => updateSetting("penaltyType", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
                  <option value="half_day">Mark as Half Day</option>
                  <option value="deduction">Salary Deduction</option>
                  <option value="warning">Warning Only</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Penalty Value</label>
                <input type="number" value={settings.penaltyValue} onChange={e => updateSetting("penaltyValue", parseFloat(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={5} step={0.5} />
                <p className="text-[10px] text-muted-foreground">Days to deduct (for salary deduction type)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {flags.working_hours_rule && (
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-4"><Timer className="w-5 h-5 text-blue-500" /> Working Hours Thresholds</h3>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.workingHoursEnabled} onChange={e => updateSetting("workingHoursEnabled", e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm font-medium">Enable working hours-based status</span>
            </label>
          </div>
          {settings.workingHoursEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Full Day Hours</label>
                <input type="number" value={settings.fullDayHours} onChange={e => updateSetting("fullDayHours", parseFloat(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={1} max={24} step={0.5} />
                <p className="text-[10px] text-muted-foreground">Hours needed for a full day</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Half Day Threshold</label>
                <input type="number" value={settings.halfDayThreshold} onChange={e => updateSetting("halfDayThreshold", parseFloat(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={24} step={0.5} />
                <p className="text-[10px] text-muted-foreground">Below this = Half Day</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Absent Threshold</label>
                <input type="number" value={settings.absentThreshold} onChange={e => updateSetting("absentThreshold", parseFloat(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={24} step={0.5} />
                <p className="text-[10px] text-muted-foreground">Below this = Absent</p>
              </div>
            </div>
          )}
        </div>
      )}

      {flags.auto_regularization && (
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <h3 className="font-semibold text-base flex items-center gap-2 mb-4"><RefreshCw className="w-5 h-5 text-emerald-500" /> Auto Regularization</h3>
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.autoRegularizationEnabled} onChange={e => updateSetting("autoRegularizationEnabled", e.target.checked)} className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm font-medium">Enable auto-regularization</span>
            </label>
          </div>
          {settings.autoRegularizationEnabled && (
            <div className="max-w-sm space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Auto-approve if late by less than (minutes)</label>
              <input type="number" value={settings.autoApproveBelowMinutes} onChange={e => updateSetting("autoApproveBelowMinutes", parseInt(e.target.value) || 0)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" min={0} max={120} />
              <p className="text-[10px] text-muted-foreground">Lates under this many minutes are automatically regularized (not counted as late)</p>
            </div>
          )}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 md:p-6 bg-secondary/20">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3">Rule Engine Pipeline</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Shift Check", active: flags.shift_rule && settings.shiftEnabled, color: "bg-blue-500" },
            { label: "Late Detection", active: flags.late_rule && settings.lateRuleEnabled, color: "bg-amber-500" },
            { label: "Auto Regularize", active: flags.auto_regularization && settings.autoRegularizationEnabled, color: "bg-emerald-500" },
            { label: "Working Hours", active: flags.working_hours_rule && settings.workingHoursEnabled, color: "bg-violet-500" },
            { label: "Penalty Check", active: flags.late_rule && settings.lateRuleEnabled, color: "bg-destructive" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground text-xs">&rarr;</span>}
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${step.active ? `${step.color} text-white` : "bg-secondary text-muted-foreground line-through opacity-60"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">Rules are processed in order. Disabled steps are skipped with zero overhead.</p>
      </div>
    </div>
  );
}
