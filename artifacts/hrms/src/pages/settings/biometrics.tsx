import { useState, useEffect } from "react";
import {
  Fingerprint,
  Plus,
  Upload,
  Loader2,
  Trash2,
  CheckCircle,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
});

const DEVICE_BRANDS = [
  "ZKTeco",
  "eSSL",
  "Biomax",
  "Realtime",
  "Mantra",
  "Suprema",
  "HikVision",
  "Matrix",
  "Anviz",
  "Timewatch",
  "Other",
];

export default function BiometricsSettings() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${BASE}/api/biometrics/settings`, {
        headers: headers(),
      });
      setDevices(await resp.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const deleteDevice = async (id: number) => {
    if (!confirm("Remove this device?")) return;
    await fetch(`${BASE}/api/biometrics/settings/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    fetchDevices();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Biometrics Setup
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure biometric devices and import attendance data.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-emerald-600/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import Attendance
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 md:p-6">
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" /> How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <p className="font-medium">Configure Device</p>
              <p className="text-xs text-muted-foreground">
                Add your biometric device brand and settings below.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <p className="font-medium">Export from Device</p>
              <p className="text-xs text-muted-foreground">
                Export attendance data as CSV from your biometric software.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <p className="font-medium">Import Here</p>
              <p className="text-xs text-muted-foreground">
                Upload the CSV to auto-populate attendance and payroll.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="glass-card rounded-2xl p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl ${d.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"} flex items-center justify-center`}
                  >
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{d.deviceBrand}</h4>
                    {d.deviceModel && (
                      <p className="text-xs text-muted-foreground">
                        {d.deviceModel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${d.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"}`}
                  >
                    {d.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => deleteDevice(d.id)}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                {d.serialNumber && (
                  <div>
                    <span className="text-muted-foreground">Serial:</span>{" "}
                    <span className="font-medium">{d.serialNumber}</span>
                  </div>
                )}
                {d.location && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium">{d.location}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Format:</span>{" "}
                  <span className="font-medium uppercase">
                    {d.importFormat}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date Fmt:</span>{" "}
                  <span className="font-medium">{d.dateFormat}</span>
                </div>
                {d.lastSyncAt && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Last Sync:</span>{" "}
                    <span className="font-medium">
                      {formatDate(d.lastSyncAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {devices.length === 0 && (
            <div className="col-span-full glass-card rounded-2xl p-8 text-center text-muted-foreground">
              No biometric devices configured. Click "Add Device" to get
              started.
            </div>
          )}
        </div>
      )}

      <AddDeviceModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => {
          setShowAdd(false);
          fetchDevices();
        }}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => setShowImport(false)}
      />
    </div>
  );
}

function AddDeviceModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    deviceBrand: "",
    deviceModel: "",
    serialNumber: "",
    location: "",
    importFormat: "csv",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      deviceBrand: "",
      deviceModel: "",
      serialNumber: "",
      location: "",
      importFormat: "csv",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "HH:mm",
    });
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceBrand) {
      setError("Device brand is required.");
      return;
    }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/biometrics/settings`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error("Failed to add device");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Biometric Device">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Device Brand *</label>
          <select
            value={form.deviceBrand}
            onChange={(e) =>
              setForm((f) => ({ ...f, deviceBrand: e.target.value }))
            }
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">Select Brand</option>
            {DEVICE_BRANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Model</label>
            <input
              type="text"
              value={form.deviceModel}
              onChange={(e) =>
                setForm((f) => ({ ...f, deviceModel: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              placeholder="e.g. K40 Pro"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Serial Number</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, serialNumber: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: e.target.value }))
            }
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            placeholder="e.g. Main Entrance"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Import Format</label>
            <select
              value={form.importFormat}
              onChange={(e) =>
                setForm((f) => ({ ...f, importFormat: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="dat">DAT</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date Format</label>
            <select
              value={form.dateFormat}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateFormat: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Time Format</label>
            <select
              value={form.timeFormat}
              onChange={(e) =>
                setForm((f) => ({ ...f, timeFormat: e.target.value }))
              }
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
            >
              <option value="HH:mm">24h (HH:mm)</option>
              <option value="hh:mm A">12h (hh:mm AM)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Add
            Device
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ open, onClose, onSuccess }: any) {
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCsvText("");
    setResult(null);
    setError("");
  }, [open]);

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(",").map((h) => h.trim());

    const empCodeIdx = headers.findIndex(
      (h) =>
        h.includes("employee") ||
        h.includes("emp") ||
        h.includes("code") ||
        h.includes("id"),
    );
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const checkInIdx = headers.findIndex(
      (h) =>
        h.includes("in") || h.includes("check_in") || h.includes("checkin"),
    );
    const checkOutIdx = headers.findIndex(
      (h) =>
        h.includes("out") || h.includes("check_out") || h.includes("checkout"),
    );
    const statusIdx = headers.findIndex((h) => h.includes("status"));

    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
          employeeCode: empCodeIdx >= 0 ? cols[empCodeIdx] : "",
          date: dateIdx >= 0 ? cols[dateIdx] : "",
          checkIn: checkInIdx >= 0 ? cols[checkInIdx] : null,
          checkOut: checkOutIdx >= 0 ? cols[checkOutIdx] : null,
          status: statusIdx >= 0 ? cols[statusIdx] : "present",
        };
      })
      .filter((r) => r.employeeCode && r.date);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError("");
    const records = parseCSV(csvText);
    if (records.length === 0) {
      setError("No valid records found in CSV.");
      return;
    }
    setImporting(true);
    try {
      const resp = await fetch(`${BASE}/api/biometrics/import`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ records }),
      });
      const data = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
    setImporting(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Attendance from Biometric"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        {result && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <CheckCircle className="w-5 h-5" /> Import Complete
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Total:</span>{" "}
                <span className="font-bold">{result.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Imported:</span>{" "}
                <span className="font-bold text-emerald-600">
                  {result.imported}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Skipped:</span>{" "}
                <span className="font-bold text-amber-600">
                  {result.skipped}
                </span>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                {result.errors.join(", ")}
              </div>
            )}
          </div>
        )}

        <div className="glass-card rounded-xl p-4">
          <p className="text-sm font-medium mb-2">CSV Format Expected:</p>
          <code className="text-xs bg-secondary p-2 rounded block overflow-x-auto whitespace-nowrap">
            employee_code,date,check_in,check_out,status
            <br />
            EMP001,2026-03-27,09:00,18:00,present
            <br />
            EMP002,2026-03-27,09:15,18:30,present
          </code>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Or Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono resize-none"
              placeholder="employee_code,date,check_in,check_out,status"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary"
          >
            Close
          </button>
          <button
            onClick={handleImport}
            disabled={importing || !csvText.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}{" "}
            Import Records
          </button>
        </div>
      </div>
    </Modal>
  );
}
