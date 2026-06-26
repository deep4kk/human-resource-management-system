import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
}

const PERMISSION_GROUPS: Record<string, string[]> = {
  Employees: ["employees:read", "employees:create", "employees:update", "employees:delete"],
  Departments: ["departments:read", "departments:create", "departments:update", "departments:delete"],
  Attendance: ["attendance:read", "attendance:create", "attendance:update", "attendance:delete"],
  Leaves: ["leaves:read", "leaves:create", "leaves:update", "leaves:delete"],
  Payroll: ["payroll:read", "payroll:create", "payroll:update", "payroll:delete"],
  Timesheets: ["timesheets:read", "timesheets:create", "timesheets:update", "timesheets:delete"],
  Performance: ["performance:read", "performance:create", "performance:update", "performance:delete"],
  Announcements: ["announcements:read", "announcements:create", "announcements:update", "announcements:delete"],
  Policies: ["policies:read", "policies:create", "policies:update", "policies:delete"],
  Holidays: ["holidays:read", "holidays:create", "holidays:update", "holidays:delete"],
  Documents: ["documents:read", "documents:create", "documents:update", "documents:delete"],
  Branding: ["branding:read", "branding:update"],
  Biometrics: ["biometrics:read", "biometrics:update"],
  "Leave Rules": ["leave-rules:read", "leave-rules:create", "leave-rules:update", "leave-rules:delete"],
  Users: ["users:read", "users:create", "users:update", "users:delete"],
  Roles: ["roles:read", "roles:create", "roles:update", "roles:delete"],
  "Audit Logs": ["audit:read"],
  Settings: ["settings:read", "settings:update"],
};

function headers() {
  const token = localStorage.getItem("hrms_token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function RolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<Role | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/roles`, { headers: headers() });
      if (res.ok) setRoles(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleSave = async () => {
    if (!name) return;
    const body = { name, description, permissions };
    const url = editing ? `${API}/api/roles/${editing.id}` : `${API}/api/roles`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
    if (res.ok) {
      setEditing(null);
      setIsNew(false);
      fetchRoles();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    await fetch(`${API}/api/roles/${id}`, { method: "DELETE", headers: headers() });
    fetchRoles();
  };

  const startEdit = (role: Role) => {
    setEditing(role);
    setIsNew(false);
    setName(role.name);
    setDescription(role.description || "");
    setPermissions(role.permissions);
  };

  const startNew = () => {
    setEditing(null);
    setIsNew(true);
    setName("");
    setDescription("");
    setPermissions([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage custom roles and their permissions</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      {(editing || isNew) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Role Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-border bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-border bg-background" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Permissions</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                <div key={group} className="p-3 rounded-xl border border-border/50 bg-background/50">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">{group}</p>
                  <div className="space-y-1">
                    {perms.map((perm) => (
                      <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={permissions.includes(perm)} onChange={() => togglePermission(perm)} className="rounded border-border" />
                        {perm.split(":")[1]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-2 rounded-xl border border-border text-sm">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">{editing ? "Update" : "Create"}</button>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Description</th>
              <th className="text-left px-4 py-3">Permissions</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-medium">{role.name} {role.isSystem && <span className="text-[10px] text-muted-foreground">(System)</span>}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{role.description || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((p) => (
                      <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{p}</span>
                    ))}
                    {role.permissions.length > 5 && <span className="text-[10px] text-muted-foreground">+{role.permissions.length - 5}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {!role.isSystem && (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(role)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(role.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && roles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No roles defined yet</div>
        )}
      </div>
    </div>
  );
}
