import { useListPayroll, useRunPayroll } from "@workspace/api-client-react";
import { Wallet, Download, CheckCircle2, RefreshCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function Payroll() {
  const { data: payroll, refetch } = useListPayroll();
  const runMutation = useRunPayroll({
    mutation: { onSuccess: () => refetch() }
  });

  const handleRunPayroll = () => {
    runMutation.mutate({ data: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Payroll Processing</h1>
          <p className="text-muted-foreground">Manage monthly salaries, deductions, and payslips.</p>
        </div>
        <button 
          onClick={handleRunPayroll}
          disabled={runMutation.isPending}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {runMutation.isPending ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
          Run Payroll
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
          <h3 className="font-semibold text-lg">Salary Records</h3>
          <select className="h-10 px-3 rounded-lg border border-border bg-background text-sm">
            <option>Oct 2023</option>
            <option>Sep 2023</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4 text-right">Basic</th>
                <th className="px-6 py-4 text-right">Allowances</th>
                <th className="px-6 py-4 text-right text-destructive">Deductions</th>
                <th className="px-6 py-4 text-right font-bold text-primary">Net Salary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {payroll?.map((record) => (
                <tr key={record.id} className="hover:bg-secondary/10">
                  <td className="px-6 py-4 font-medium">{record.employeeName}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(record.basicSalary)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(record.allowances)}</td>
                  <td className="px-6 py-4 text-right text-destructive">{formatCurrency(record.deductions)}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(record.netSalary)}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full w-max">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors inline-flex">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!payroll || payroll.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No payroll records for this period.
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
