import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, FileSpreadsheet, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

function headers() {
  const token = localStorage.getItem("hrms_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function ExportImport() {
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const downloadCSV = async (endpoint: string, filename: string) => {
    try {
      const res = await fetch(`${API}/api/export/${endpoint}`, { headers: headers() });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch(`${API}/api/export/employees/import`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ csv: csvText }),
      });
      if (res.ok) setImportResult(await res.json());
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Export / Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Export data to CSV or import employees in bulk</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Download className="w-5 h-5 text-primary" /></div>
            <div><h3 className="font-semibold">Export Data</h3><p className="text-xs text-muted-foreground">Download CSV files</p></div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Employees", file: "employees/csv", name: "employees.csv" },
              { label: "Attendance", file: "attendance/csv", name: "attendance.csv" },
              { label: "Payroll", file: "payroll/csv", name: "payroll.csv" },
            ].map((item) => (
              <button key={item.label} onClick={() => downloadCSV(item.file, item.name)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors">
                <span className="text-sm font-medium">{item.label}</span>
                <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Upload className="w-5 h-5 text-primary" /></div>
            <div><h3 className="font-semibold">Import Employees</h3><p className="text-xs text-muted-foreground">Paste CSV data with headers: FirstName, LastName, Email, Department, Designation, Status, Salary</p></div>
          </div>
          <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={6} className="w-full p-3 rounded-xl border border-border bg-background text-sm font-mono" placeholder="FirstName,LastName,Email,Department,Designation,Status,Salary&#10;John,Doe,john@example.com,Engineering,Developer,active,75000" />
          <button onClick={handleImport} disabled={importing || !csvText.trim()} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import CSV
          </button>
          {importResult && (
            <div className="p-3 rounded-xl bg-secondary/50 text-sm">
              <p className="text-green-600 dark:text-green-400">Imported: {importResult.imported}</p>
              {importResult.failed > 0 && <p className="text-destructive">Failed: {importResult.failed}</p>}
              {importResult.details?.filter((d: any) => !d.success).map((d: any, i: number) => (
                <p key={i} className="text-xs text-muted-foreground mt-1">Row error: {d.error}</p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
