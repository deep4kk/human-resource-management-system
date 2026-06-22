import { useState, useEffect } from "react";
import { useListTimesheets } from "@hrms/api-client";
import { Clock, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Timesheets() {
  const { user } = useAuth();
  const { data: timesheets, isLoading, refetch } = useListTimesheets();
  const [showAdd, setShowAdd] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const isAdmin =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  const weeklyHours = (() => {
    if (!timesheets) return { total: 0, billable: 0 };
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const thisWeek = timesheets.filter((t: any) => t.date >= weekStartStr);
    return {
      total: thisWeek.reduce((s: number, t: any) => s + (t.hours || 0), 0),
      billable: thisWeek
        .filter((t: any) => t.billable)
        .reduce((s: number, t: any) => s + (t.hours || 0), 0),
    };
  })();

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await fetch(`${BASE}/api/timesheets/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify({ status }),
      });
      refetch();
    } catch {}
    setUpdatingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Timesheets
          </h1>
          <p className="text-muted-foreground">
            Log hours against projects and tasks.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Log Time
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-primary">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Total Logged (This Week)
            </p>
            <p className="text-2xl font-bold">
              {weeklyHours.total.toFixed(1)} hrs
            </p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billable Hours</p>
            <p className="text-2xl font-bold">
              {weeklyHours.billable.toFixed(1)} hrs
            </p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-accent">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{timesheets?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Hours</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {timesheets?.map((ts: any) => (
                  <tr key={ts.id} className="hover:bg-secondary/10">
                    <td className="px-6 py-4">{formatDate(ts.date)}</td>
                    <td className="px-6 py-4 font-medium">{ts.employeeName}</td>
                    <td className="px-6 py-4">{ts.project}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {ts.task}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {ts.hours}h{" "}
                      {ts.billable && (
                        <span className="text-xs ml-1 text-emerald-500 bg-emerald-500/10 px-1.5 rounded">
                          $
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium border ${
                          ts.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : ts.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {ts.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {ts.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                handleStatusChange(ts.id, "approved")
                              }
                              disabled={updatingId === ts.id}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Approve"
                            >
                              {updatingId === ts.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(ts.id, "rejected")
                              }
                              disabled={updatingId === ts.id}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {(!timesheets || timesheets.length === 0) && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No timesheets logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <LogTimeModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        user={user}
        onSuccess={() => {
          setShowAdd(false);
          refetch();
        }}
      />
    </div>
  );
}

function LogTimeModal({ open, onClose, user, onSuccess }: any) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    task: "",
    hours: "",
    billable: true,
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      project: "",
      task: "",
      hours: "",
      billable: true,
      description: "",
    });
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.project || !form.task || !form.hours) {
      setError("Project, task, and hours are required.");
      return;
    }
    if (!user?.employeeId) {
      setError("Your account is not linked to an employee record.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/timesheets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify({
          employeeId: user.employeeId,
          date: form.date,
          project: form.project,
          task: form.task,
          hours: Number(form.hours),
          billable: form.billable,
          description: form.description || null,
        }),
      });
      if (!resp.ok) throw new Error("Failed to log time");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} title="Log Time">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Hours</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={form.hours}
              onChange={(e) => set("hours", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              placeholder="8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Project</label>
          <input
            type="text"
            value={form.project}
            onChange={(e) => set("project", e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            placeholder="e.g. HRMS Portal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Task</label>
          <input
            type="text"
            value={form.task}
            onChange={(e) => set("task", e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            placeholder="e.g. Frontend Development"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
            placeholder="What did you work on?"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.billable}
            onChange={(e) => set("billable", e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">Billable</span>
        </label>

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
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Log Time
          </button>
        </div>
      </form>
    </Modal>
  );
}
