import { useListTimesheets } from "@workspace/api-client-react";
import { Clock, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Timesheets() {
  const { data: timesheets } = useListTimesheets();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground">Log hours against projects and tasks.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Log Time
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-primary">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Logged (This Week)</p>
            <p className="text-2xl font-bold">42.5 hrs</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billable Hours</p>
            <p className="text-2xl font-bold">38.0 hrs</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {timesheets?.map((ts) => (
                <tr key={ts.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4">{formatDate(ts.date)}</td>
                  <td className="px-6 py-4 font-medium">{ts.employeeName}</td>
                  <td className="px-6 py-4">{ts.project}</td>
                  <td className="px-6 py-4 text-muted-foreground">{ts.task}</td>
                  <td className="px-6 py-4 font-bold">{ts.hours}h {ts.billable && <span className="text-xs ml-1 text-emerald-500 bg-emerald-500/10 px-1.5 rounded">$</span>}</td>
                  <td className="px-6 py-4">
                     <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium border ${
                      ts.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      ts.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {ts.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!timesheets || timesheets.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No timesheets logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
