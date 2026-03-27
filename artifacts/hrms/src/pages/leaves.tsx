import { useState, useEffect } from "react";
import { useListLeaves } from "@workspace/api-client-react";
import { Plane, CalendarRange, Clock, CheckCircle, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Leaves() {
  const { user } = useAuth();
  const { data: leaves, isLoading, refetch } = useListLeaves();
  const [showApply, setShowApply] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  useEffect(() => {
    if (isAdmin) {
      fetch(`${BASE}/api/employees?limit=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("hrms_token")}` }
      }).then(r => r.json()).then(d => {
        if (d?.employees) setEmployees(d.employees);
      }).catch(() => {});
    }
  }, [isAdmin]);

  const leaveBalances = (() => {
    if (!leaves || !user?.employeeId) return { annual: { total: 20, used: 0 }, sick: { total: 10, used: 0 }, casual: { total: 5, used: 0 }, unpaid: { total: 0, used: 0 } };
    const myLeaves = leaves.filter((l: any) => l.employeeId === user.employeeId && l.status === "approved");
    const annual = myLeaves.filter((l: any) => l.leaveType === "annual").reduce((s: number, l: any) => s + l.days, 0);
    const sick = myLeaves.filter((l: any) => l.leaveType === "sick").reduce((s: number, l: any) => s + l.days, 0);
    const casual = myLeaves.filter((l: any) => l.leaveType === "casual").reduce((s: number, l: any) => s + l.days, 0);
    const unpaid = myLeaves.filter((l: any) => l.leaveType === "unpaid").reduce((s: number, l: any) => s + l.days, 0);
    return { annual: { total: 20, used: annual }, sick: { total: 10, used: sick }, casual: { total: 5, used: casual }, unpaid: { total: 0, used: unpaid } };
  })();

  const handleStatusChange = async (leaveId: number, status: string) => {
    setUpdatingId(leaveId);
    try {
      await fetch(`${BASE}/api/leaves/${leaveId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` },
        body: JSON.stringify({ status, approvedBy: user?.employeeId }),
      });
      refetch();
    } catch {}
    setUpdatingId(null);
  };

  const balanceCards = [
    { type: 'Annual Leave', ...leaveBalances.annual, icon: CalendarRange, color: 'text-blue-500' },
    { type: 'Sick Leave', ...leaveBalances.sick, icon: Clock, color: 'text-amber-500' },
    { type: 'Casual Leave', ...leaveBalances.casual, icon: Plane, color: 'text-emerald-500' },
    { type: 'Unpaid Leave', ...leaveBalances.unpaid, icon: CheckCircle, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leaves and track your balances.</p>
        </div>
        <button onClick={() => setShowApply(true)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {balanceCards.map(bal => (
          <div key={bal.type} className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-secondary ${bal.color}`}>
                <bal.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm">{bal.type}</h4>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{bal.total > 0 ? bal.total - bal.used : 0}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {bal.total} remaining</span>
            </div>
            {bal.total > 0 && (
              <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min((bal.used/bal.total)*100, 100)}%`}}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold text-lg">Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leaves?.map((leave: any) => (
                <tr key={leave.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4 font-medium">{leave.employeeName}</td>
                  <td className="px-6 py-4 capitalize">{leave.leaveType}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4">{leave.days}</td>
                  <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">{leave.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium border ${
                      leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      leave.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      {leave.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleStatusChange(leave.id, "approved")}
                            disabled={updatingId === leave.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Approve"
                          >
                            {updatingId === leave.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleStatusChange(leave.id, "rejected")}
                            disabled={updatingId === leave.id}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {(!leaves || leaves.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-muted-foreground">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ApplyLeaveModal 
        open={showApply} 
        onClose={() => setShowApply(false)} 
        user={user}
        employees={employees}
        isAdmin={isAdmin}
        onSuccess={() => { setShowApply(false); refetch(); }}
      />
    </div>
  );
}

function ApplyLeaveModal({ open, onClose, user, employees, isAdmin, onSuccess }: any) {
  const [form, setForm] = useState({
    employeeId: "",
    leaveType: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    setForm({
      employeeId: user?.employeeId ? String(user.employeeId) : "",
      leaveType: "annual",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setError("");
  }, [open, user]);

  const days = (() => {
    if (!form.startDate || !form.endDate) return 0;
    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.employeeId || !form.startDate || !form.endDate || !form.reason) {
      setError("All fields are required.");
      return;
    }
    if (days <= 0) { setError("End date must be after start date."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` },
        body: JSON.stringify({
          employeeId: Number(form.employeeId),
          leaveType: form.leaveType,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
        }),
      });
      if (!resp.ok) throw new Error("Failed to apply leave");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        
        {isAdmin ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Employee</label>
            <select value={form.employeeId} onChange={e => set("employeeId", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="">Select Employee</option>
              {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
            </select>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Leave Type</label>
          <select value={form.leaveType} onChange={e => set("leaveType", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">End Date</label>
            <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
          </div>
        </div>

        {days > 0 && <p className="text-sm text-primary font-medium">{days} day{days > 1 ? 's' : ''} requested</p>}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Reason</label>
          <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" placeholder="Reason for leave..." />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit Request
          </button>
        </div>
      </form>
    </Modal>
  );
}
