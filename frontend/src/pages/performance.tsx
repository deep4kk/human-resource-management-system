import { useState, useEffect } from "react";
import { useListKpis, useListAppraisals } from "@hrms/api-client";
import { Target, Star, Award, Plus, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Performance() {
  const { user } = useAuth();
  const { data: kpis, refetch: refetchKpis } = useListKpis();
  const { data: appraisals, refetch: refetchAppraisals } = useListAppraisals();
  const [showKpi, setShowKpi] = useState(false);
  const [showAppraisal, setShowAppraisal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const isAdmin =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  useEffect(() => {
    if (isAdmin) {
      fetch(`${BASE}/api/employees?limit=100`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.employees) setEmployees(d.employees);
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Performance & KPIs
          </h1>
          <p className="text-muted-foreground">
            Track goals, metrics, and team appraisals.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowKpi(true)}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add KPI
            </button>
            <button
              onClick={() => setShowAppraisal(true)}
              className="px-4 py-2.5 bg-accent text-white rounded-xl font-semibold shadow-lg shadow-accent/25 hover:shadow-xl transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Appraisal
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Active KPIs
          </h2>
          {kpis?.map((kpi: any) => (
            <div
              key={kpi.id}
              className="glass-card p-6 rounded-2xl relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{kpi.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {kpi.employeeName} &bull; {kpi.period}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    kpi.status === "on_track"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : kpi.status === "at_risk"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : kpi.status === "completed"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {kpi.status?.replace("_", " ")}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {kpi.achieved} {kpi.unit} achieved
                  </span>
                  <span className="text-muted-foreground">
                    Target: {kpi.target} {kpi.unit}
                  </span>
                </div>
                <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      kpi.achieved / kpi.target >= 1
                        ? "bg-emerald-500"
                        : kpi.achieved / kpi.target >= 0.7
                          ? "bg-primary"
                          : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min((kpi.achieved / kpi.target) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round((kpi.achieved / kpi.target) * 100)}% complete
                </p>
              </div>
            </div>
          ))}
          {(!kpis || kpis.length === 0) && (
            <div className="glass-card p-8 rounded-2xl text-center text-muted-foreground border-dashed">
              No active KPIs found.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" /> Recent Appraisals
          </h2>
          {appraisals?.map((app: any) => (
            <div key={app.id} className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Star className="w-5 h-5 fill-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{app.employeeName}</h4>
                    <p className="text-xs text-muted-foreground">
                      Reviewed by: {app.reviewerName} &bull; {app.period}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {app.overallRating}
                    <span className="text-base text-muted-foreground">/5</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Technical Skills
                  </span>
                  <RatingStars rating={app.technicalSkills} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Communication
                  </span>
                  <RatingStars rating={app.communication} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Teamwork
                  </span>
                  <RatingStars rating={app.teamwork} />
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Leadership
                  </span>
                  <RatingStars rating={app.leadership} />
                </div>
              </div>
              {app.comments && (
                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50 italic">
                  "{app.comments}"
                </p>
              )}
            </div>
          ))}
          {(!appraisals || appraisals.length === 0) && (
            <div className="glass-card p-8 rounded-2xl text-center text-muted-foreground border-dashed">
              No appraisals found.
            </div>
          )}
        </div>
      </div>

      <AddKpiModal
        open={showKpi}
        onClose={() => setShowKpi(false)}
        employees={employees}
        user={user}
        onSuccess={() => {
          setShowKpi(false);
          refetchKpis();
        }}
      />
      <AddAppraisalModal
        open={showAppraisal}
        onClose={() => setShowAppraisal(false)}
        employees={employees}
        user={user}
        onSuccess={() => {
          setShowAppraisal(false);
          refetchAppraisals();
        }}
      />
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-accent fill-accent" : "text-muted"}`}
        />
      ))}
    </div>
  );
}

function AddKpiModal({ open, onClose, employees, user, onSuccess }: any) {
  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    target: "",
    achieved: "0",
    unit: "tasks",
    period: "Q1 2026",
    status: "on_track",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      employeeId: "",
      title: "",
      target: "",
      achieved: "0",
      unit: "tasks",
      period: "Q1 2026",
      status: "on_track",
      description: "",
    });
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.title || !form.target) {
      setError("Employee, title, and target are required.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/performance/kpis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify({
          ...form,
          employeeId: Number(form.employeeId),
          target: Number(form.target),
          achieved: Number(form.achieved),
        }),
      });
      if (!resp.ok) throw new Error("Failed to create KPI");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} title="Add KPI">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Employee</label>
          <select
            value={form.employeeId}
            onChange={(e) => set("employeeId", e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select Employee</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">KPI Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            placeholder="e.g. Close 50 support tickets"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Target</label>
            <input
              type="number"
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Achieved</label>
            <input
              type="number"
              value={form.achieved}
              onChange={(e) => set("achieved", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Unit</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              placeholder="tasks"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Period</label>
            <input
              type="text"
              value={form.period}
              onChange={(e) => set("period", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              placeholder="Q1 2026"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
            KPI
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddAppraisalModal({ open, onClose, employees, user, onSuccess }: any) {
  const [form, setForm] = useState({
    employeeId: "",
    period: "H1 2026",
    overallRating: "4",
    technicalSkills: "4",
    communication: "4",
    teamwork: "4",
    leadership: "3",
    comments: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      employeeId: "",
      period: "H1 2026",
      overallRating: "4",
      technicalSkills: "4",
      communication: "4",
      teamwork: "4",
      leadership: "3",
      comments: "",
    });
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      setError("Employee is required.");
      return;
    }
    if (!user?.employeeId) {
      setError("Your account is not linked to an employee.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/performance/appraisals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          reviewerId: user.employeeId,
          period: form.period,
          overallRating: Number(form.overallRating),
          technicalSkills: Number(form.technicalSkills),
          communication: Number(form.communication),
          teamwork: Number(form.teamwork),
          leadership: Number(form.leadership),
          comments: form.comments || null,
        }),
      });
      if (!resp.ok) throw new Error("Failed to create appraisal");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const RatingSelect = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={(form as any)[field]}
        onChange={(e) => set(field, e.target.value)}
        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
      >
        {[1, 2, 3, 4, 5].map((v) => (
          <option key={v} value={v}>
            {v} - {["Poor", "Below Avg", "Average", "Good", "Excellent"][v - 1]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Appraisal"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => set("employeeId", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">Select Employee</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Period</label>
            <input
              type="text"
              value={form.period}
              onChange={(e) => set("period", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        </div>
        <RatingSelect label="Overall Rating" field="overallRating" />
        <div className="grid grid-cols-2 gap-4">
          <RatingSelect label="Technical Skills" field="technicalSkills" />
          <RatingSelect label="Communication" field="communication" />
          <RatingSelect label="Teamwork" field="teamwork" />
          <RatingSelect label="Leadership" field="leadership" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Comments</label>
          <textarea
            value={form.comments}
            onChange={(e) => set("comments", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            placeholder="Performance review comments..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{" "}
            Submit Appraisal
          </button>
        </div>
      </form>
    </Modal>
  );
}
