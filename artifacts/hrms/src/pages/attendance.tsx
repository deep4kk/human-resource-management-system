import { useState, useEffect, useCallback } from "react";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2, Fingerprint, Upload, ChevronDown, ChevronRight, Info, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useAttendanceData() {
  const [today, setToday] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
  }), []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch(`${BASE}/api/attendance/today`, { headers: headers() }),
        fetch(`${BASE}/api/attendance`, { headers: headers() }),
      ]);
      if (!todayRes.ok || !histRes.ok) throw new Error("Failed to fetch attendance data");
      setToday(await todayRes.json());
      setHistory(await histRes.json());
    } catch (err: any) {
      setError(err.message || "Failed to load attendance data");
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { today, history, loading, error, refetch: fetchAll };
}

export default function Attendance() {
  const { user } = useAuth();
  const { today, history, loading } = useAttendanceData();
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "hr";
  const myEmployeeId = user?.employeeId;
  const myTodayRecord = today?.records?.find((r: any) => r.employeeId === myEmployeeId);
  const hasCheckedIn = !!myTodayRecord;
  const hasCheckedOut = !!myTodayRecord?.checkOut;

  const formatTime = (t: string | null) => {
    if (!t) return "--:--";
    const parts = t.split(":");
    const h = parseInt(parts[0]);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      late: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      half_day: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      absent: "bg-destructive/10 text-destructive border-destructive/20",
      on_leave: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    };
    return styles[status] || "bg-secondary text-muted-foreground border-border";
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">Daily attendance tracked via biometric devices with rule-based processing.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <a href={`${BASE}/settings/attendance-rules`} className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-semibold glass-btn border border-border flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Rules Config
            </a>
            <a href={`${BASE}/settings/biometrics`} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import Data
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 glass-card p-5 md:p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="text-primary w-5 h-5"/> Today's Status</h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-secondary/50 p-4 md:p-6 rounded-xl border border-border/50 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Current Status</p>
              <div className="flex items-center gap-3">
                {hasCheckedIn && !hasCheckedOut ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-foreground">Working</span>
                  </>
                ) : hasCheckedOut ? (
                  <>
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span></span>
                    <span className="text-xl md:text-2xl font-bold text-foreground">Day Complete</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    <span className="text-xl md:text-2xl font-bold text-foreground">Not Recorded</span>
                  </>
                )}
              </div>
              {myTodayRecord && (
                <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <p>Check-in: {formatTime(myTodayRecord.checkIn)}</p>
                  {myTodayRecord.checkOut && <p>Check-out: {formatTime(myTodayRecord.checkOut)}</p>}
                  {myTodayRecord.workHours && <p>Hours: {myTodayRecord.workHours}h</p>}
                  {myTodayRecord.ruleEvents?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {myTodayRecord.ruleEvents.map((e: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span className="text-[10px] text-muted-foreground">{e}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 px-3 py-2 rounded-lg">
              <Fingerprint className="w-4 h-4 text-primary" />
              <span>Biometric + Rule Engine</span>
            </div>
          </div>
          {!myEmployeeId && (
            <p className="text-xs text-amber-600 mt-3">Your account is not linked to an employee record. Contact admin.</p>
          )}
        </div>

        <div className="glass-card p-5 md:p-6 rounded-2xl">
          <h3 className="font-semibold mb-4 text-sm">Company Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4"/> Present</div>
              <span className="font-bold">{today?.present || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-2 text-destructive text-sm"><XCircle className="w-4 h-4"/> Absent</div>
              <span className="font-bold">{today?.absent || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-amber-600 text-sm"><AlertCircle className="w-4 h-4"/> Late</div>
              <span className="font-bold">{today?.late || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 text-sm"><Calendar className="w-4 h-4"/> Half Day</div>
              <span className="font-bold">{today?.halfDay || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-violet-500/10 rounded-lg">
              <div className="flex items-center gap-2 text-violet-600 text-sm"><Calendar className="w-4 h-4"/> On Leave</div>
              <span className="font-bold">{today?.onLeave || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/50">
          <h3 className="font-semibold text-base md:text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary"/> Attendance History</h3>
          <p className="text-xs text-muted-foreground mt-1">Click any row to view rule engine events and processing logs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-4 md:px-6 py-3 w-8"></th>
                <th className="px-4 md:px-6 py-3">Date</th>
                <th className="px-4 md:px-6 py-3">Employee</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Check In</th>
                <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Check Out</th>
                <th className="px-4 md:px-6 py-3 hidden md:table-cell">Hours</th>
                <th className="px-4 md:px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history?.map((record: any) => {
                const hasEvents = record.ruleEvents?.length > 0;
                const isExpanded = expandedLog === record.id;
                return (
                  <tr key={record.id} className="group" onClick={() => hasEvents && setExpandedLog(isExpanded ? null : record.id)} style={{ cursor: hasEvents ? "pointer" : "default" }}>
                    <td className="px-2 md:px-3 py-3">
                      {hasEvents ? (
                        isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      ) : <span className="w-4 h-4 block" />}
                    </td>
                    <td className="px-4 md:px-6 py-3 font-medium text-xs md:text-sm">{formatDate(record.date)}</td>
                    <td className="px-4 md:px-6 py-3 text-xs md:text-sm">{record.employeeName}</td>
                    <td className="px-4 md:px-6 py-3 text-muted-foreground hidden sm:table-cell">{formatTime(record.checkIn)}</td>
                    <td className="px-4 md:px-6 py-3 text-muted-foreground hidden sm:table-cell">{formatTime(record.checkOut)}</td>
                    <td className="px-4 md:px-6 py-3 hidden md:table-cell">{record.workHours ? `${record.workHours}h` : '-'}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${statusBadge(record.status)}`}>
                        {record.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {history?.map((record: any) => {
                if (expandedLog !== record.id || !record.ruleEvents?.length) return null;
                return (
                  <tr key={`log-${record.id}`} className="bg-secondary/20">
                    <td colSpan={7} className="px-4 md:px-6 py-3">
                      <div className="ml-6 md:ml-10 space-y-1.5">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rule Engine Log</p>
                        {record.ruleEvents.map((event: string, i: number) => {
                          const isWarning = event.toLowerCase().includes("penalty") || event.toLowerCase().includes("absent") || event.toLowerCase().includes("exceeded");
                          const isGood = event.toLowerCase().includes("auto-regularized") || event.toLowerCase().includes("full day");
                          return (
                            <div key={i} className="flex items-start gap-2">
                              {isWarning ? <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" /> : isGood ? <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /> : <Info className="w-3 h-3 text-primary mt-0.5 shrink-0" />}
                              <span className={`text-xs ${isWarning ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{event}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!history || history.length === 0) && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
