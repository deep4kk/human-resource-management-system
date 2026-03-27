import { useState } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2, LogIn, LogOut } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useAttendanceData() {
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch(`${BASE}/api/attendance/today`, { headers: headers() }),
        fetch(`${BASE}/api/attendance`, { headers: headers() }),
      ]);
      setToday(await todayRes.json());
      setHistory(await histRes.json());
    } catch {}
    setLoading(false);
  };

  useState(() => { fetchAll(); });

  return { today, history, loading, refetch: fetchAll };
}

export default function Attendance() {
  const { user } = useAuth();
  const { today, history, loading, refetch } = useAttendanceData();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const myEmployeeId = user?.employeeId;
  const todayDate = new Date().toISOString().split("T")[0];
  const myTodayRecord = today?.records?.find((r: any) => r.employeeId === myEmployeeId);
  const hasCheckedIn = !!myTodayRecord;
  const hasCheckedOut = !!myTodayRecord?.checkOut;

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
  });

  const handleCheckIn = async () => {
    if (!myEmployeeId) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      await fetch(`${BASE}/api/attendance`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          employeeId: myEmployeeId,
          date: todayDate,
          status: "present",
          checkIn: timeStr,
        }),
      });
      await refetch();
    } catch {}
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    if (!myTodayRecord) return;
    setCheckingOut(true);
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
      await fetch(`${BASE}/api/attendance/${myTodayRecord.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ checkOut: timeStr }),
      });
      await refetch();
    } catch {}
    setCheckingOut(false);
  };

  const formatTime = (t: string | null) => {
    if (!t) return "--:--";
    const parts = t.split(":");
    const h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground">Track your daily punch-ins and working hours.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Clock className="text-primary"/> Today's Log</h2>
          
          <div className="flex items-center justify-between bg-secondary/50 p-6 rounded-xl border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Current Status</p>
              <div className="flex items-center gap-3">
                {hasCheckedIn && !hasCheckedOut ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-2xl font-bold text-foreground">Working</span>
                  </>
                ) : hasCheckedOut ? (
                  <>
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span></span>
                    <span className="text-2xl font-bold text-foreground">Day Complete</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    <span className="text-2xl font-bold text-foreground">Not Checked In</span>
                  </>
                )}
              </div>
              {myTodayRecord && (
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <p>Check-in: {formatTime(myTodayRecord.checkIn)}</p>
                  {myTodayRecord.checkOut && <p>Check-out: {formatTime(myTodayRecord.checkOut)}</p>}
                  {myTodayRecord.workHours && <p>Hours: {myTodayRecord.workHours}h</p>}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCheckIn}
                disabled={hasCheckedIn || checkingIn || !myEmployeeId}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
              >
                {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                Check In
              </button>
              <button 
                onClick={handleCheckOut}
                disabled={!hasCheckedIn || hasCheckedOut || checkingOut}
                className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                Check Out
              </button>
            </div>
          </div>
          {!myEmployeeId && (
            <p className="text-xs text-amber-600 mt-3">Your user account is not linked to an employee record. Ask an admin to link it.</p>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-semibold mb-4">Company Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4"/> Present</div>
              <span className="font-bold">{today?.present || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-2 text-destructive"><XCircle className="w-4 h-4"/> Absent</div>
              <span className="font-bold">{today?.absent || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600"><AlertCircle className="w-4 h-4"/> Late</div>
              <span className="font-bold">{today?.late || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600"><Calendar className="w-4 h-4"/> On Leave</div>
              <span className="font-bold">{today?.onLeave || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history?.map((record: any) => (
                <tr key={record.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4 font-medium">{formatDate(record.date)}</td>
                  <td className="px-6 py-4">{record.employeeName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatTime(record.checkIn)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatTime(record.checkOut)}</td>
                  <td className="px-6 py-4">{record.workHours ? `${record.workHours}h` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium border ${
                      record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      record.status === 'late' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {record.status?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
