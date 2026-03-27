import { useGetTodayAttendance, useListAttendance, useCreateAttendance } from "@workspace/api-client-react";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Attendance() {
  const { data: today, refetch: refetchToday } = useGetTodayAttendance();
  const { data: history, refetch: refetchHistory } = useListAttendance();
  const markAttendance = useCreateAttendance({
    mutation: {
      onSuccess: () => {
        refetchToday();
        refetchHistory();
      }
    }
  });

  const handleCheckIn = () => {
    markAttendance.mutate({
      data: {
        employeeId: 1, // hardcoded for demo
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        checkIn: new Date().toISOString()
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
        <p className="text-muted-foreground">Track your daily punch-ins and working hours.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Clock className="text-primary"/> Today's Log</h2>
          
          <div className="flex items-center justify-between bg-secondary/50 p-6 rounded-xl border border-border/50">
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">Current Status</p>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-2xl font-bold text-foreground">Working</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Check-in at 09:00 AM</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCheckIn}
                disabled={markAttendance.isPending}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Web Check In
              </button>
              <button className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-xl font-semibold transition-all">
                Web Check Out
              </button>
            </div>
          </div>
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
              {history?.map((record) => (
                <tr key={record.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4 font-medium">{formatDate(record.date)}</td>
                  <td className="px-6 py-4">{record.employeeName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '--:--'}</td>
                  <td className="px-6 py-4">{record.workHours ? `${record.workHours}h` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
