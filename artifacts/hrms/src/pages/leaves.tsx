import { useListLeaves } from "@workspace/api-client-react";
import { Plane, CalendarRange, Clock, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Leaves() {
  const { data: leaves, isLoading } = useListLeaves();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leaves and track your balances.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plane className="w-5 h-5" /> Apply Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { type: 'Annual Leave', total: 20, used: 5, icon: CalendarRange, color: 'text-blue-500' },
          { type: 'Sick Leave', total: 10, used: 2, icon: Clock, color: 'text-amber-500' },
          { type: 'Casual Leave', total: 5, used: 0, icon: Plane, color: 'text-emerald-500' },
          { type: 'Unpaid Leave', total: 0, used: 0, icon: CheckCircle, color: 'text-purple-500' }
        ].map(bal => (
          <div key={bal.type} className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-secondary ${bal.color}`}>
                <bal.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm">{bal.type}</h4>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-foreground">{bal.total - bal.used}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {bal.total} remaining</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${(bal.used/bal.total)*100}%`}}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold text-lg">Recent Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leaves?.map((leave) => (
                <tr key={leave.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4 font-medium">{leave.employeeName}</td>
                  <td className="px-6 py-4 capitalize">{leave.leaveType}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4">{leave.days}</td>
                  <td className="px-6 py-4">
                    <span className={`capitalize px-2.5 py-1 rounded-full text-xs font-medium border ${
                      leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                      leave.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!leaves || leaves.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No leave requests found.
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
