import { useState, useEffect } from "react";
import {
  Wallet,
  Download,
  CheckCircle2,
  RefreshCcw,
  Loader2,
  Eye,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function usePayrollData(month: number, year: number) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${BASE}/api/payroll?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
          },
        },
      );
      const d = await resp.json();
      setData(Array.isArray(d) ? d : []);
    } catch {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch_();
  }, [month, year]);

  return { data, loading, refetch: fetch_ };
}

export default function Payroll() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data: payroll, loading, refetch } = usePayrollData(month, year);
  const [running, setRunning] = useState(false);
  const [payslip, setPayslip] = useState<any>(null);

  const handleRunPayroll = async () => {
    setRunning(true);
    try {
      await fetch(`${BASE}/api/payroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify({ month, year }),
      });
      refetch();
    } catch {}
    setRunning(false);
  };

  const viewPayslip = async (id: number) => {
    try {
      const resp = await fetch(`${BASE}/api/payroll/${id}/payslip`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
      });
      const data = await resp.json();
      setPayslip(data);
    } catch {}
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--)
    years.push(y);

  const totals = payroll.reduce(
    (acc, r) => ({
      basic: acc.basic + (r.basicSalary || 0),
      gross: acc.gross + (r.grossSalary || 0),
      deductions: acc.deductions + (r.deductions || 0),
      net: acc.net + (r.netSalary || 0),
    }),
    { basic: 0, gross: 0, deductions: 0, net: 0 },
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Payroll Processing
          </h1>
          <p className="text-muted-foreground">
            Manage monthly salaries, deductions, and payslips.
          </p>
        </div>
        <button
          onClick={handleRunPayroll}
          disabled={running}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {running ? (
            <RefreshCcw className="w-5 h-5 animate-spin" />
          ) : (
            <Wallet className="w-5 h-5" />
          )}
          Run Payroll for {months[month - 1]} {year}
        </button>
      </div>

      {payroll.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <p className="text-sm text-muted-foreground">Total Basic</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totals.basic)}
            </p>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <p className="text-sm text-muted-foreground">Total Gross</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {formatCurrency(totals.gross)}
            </p>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <p className="text-sm text-muted-foreground">Total Deductions</p>
            <p className="text-2xl font-bold text-destructive mt-1">
              {formatCurrency(totals.deductions)}
            </p>
          </div>
          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground">Total Net Pay</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {formatCurrency(totals.net)}
            </p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
          <h3 className="font-semibold text-lg">Salary Records</h3>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading...
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4 text-right">Basic</th>
                  <th className="px-6 py-4 text-right">Allowances</th>
                  <th className="px-6 py-4 text-right text-destructive">
                    Deductions
                  </th>
                  <th className="px-6 py-4 text-right font-bold text-primary">
                    Net Salary
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {payroll.map((record: any) => (
                  <tr key={record.id} className="hover:bg-secondary/10">
                    <td className="px-6 py-4 font-medium">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(record.basicSalary)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(record.allowances)}
                    </td>
                    <td className="px-6 py-4 text-right text-destructive">
                      {formatCurrency(record.deductions)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {formatCurrency(record.netSalary)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-full w-max">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => viewPayslip(record.id)}
                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors inline-flex"
                        title="View Payslip"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {payroll.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No payroll records for {months[month - 1]} {year}. Click
                      "Run Payroll" to generate.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={!!payslip}
        onClose={() => setPayslip(null)}
        title="Payslip"
        maxWidth="max-w-xl"
      >
        {payslip && (
          <div className="space-y-6">
            <div className="text-center border-b border-border/50 pb-4">
              <h3 className="text-xl font-bold text-primary">
                {payslip.company?.name || "Flowmative"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Payslip for {months[(payslip.payroll?.month || 1) - 1]}{" "}
                {payslip.payroll?.year}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-semibold">{payslip.payroll?.employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Employee Code</p>
                <p className="font-semibold">
                  {payslip.employee?.employeeCode}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Designation</p>
                <p className="font-semibold">
                  {payslip.employee?.designation || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Working Days</p>
                <p className="font-semibold">
                  {payslip.payroll?.presentDays} /{" "}
                  {payslip.payroll?.workingDays}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-emerald-600 uppercase tracking-wider">
                  Earnings
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span>{formatCurrency(payslip.payroll?.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA</span>
                    <span>{formatCurrency(payslip.payroll?.hra)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allowances</span>
                    <span>{formatCurrency(payslip.payroll?.allowances)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Gross</span>
                    <span>{formatCurrency(payslip.payroll?.grossSalary)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-destructive uppercase tracking-wider">
                  Deductions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>PF</span>
                    <span>{formatCurrency(payslip.payroll?.pf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ESI</span>
                    <span>{formatCurrency(payslip.payroll?.esi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TDS</span>
                    <span>{formatCurrency(payslip.payroll?.tds)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(payslip.payroll?.deductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">Net Pay</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(payslip.payroll?.netSalary)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
