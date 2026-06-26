import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

interface AuditEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

function headers() {
  const token = localStorage.getItem("hrms_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filter) params.set("action", filter);
      const res = await fetch(`${API}/api/audit-logs?${params}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, filter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all changes made in the system</p>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-background text-sm"
          />
        </div>
        <span className="text-sm text-muted-foreground">{total} total entries</span>
      </div>

      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-3">Timestamp</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Resource</th>
                <th className="text-left px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium">{log.actorName}</td>
                  <td className="px-4 py-3 text-sm"><span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{log.actorRole}</span></td>
                  <td className="px-4 py-3 text-sm"><span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{log.action}</span></td>
                  <td className="px-4 py-3 text-sm">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(-6)}` : ""}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.ip || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No audit logs found</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50">Previous</button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
