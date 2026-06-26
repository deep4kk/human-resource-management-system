import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Building2, ToggleLeft, ToggleRight, Shield, Search, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

interface Company {
  id: string;
  name: string;
  email: string;
  slug: string;
  isActive: boolean;
  userCount: number;
  createdAt: string;
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  companyName: string | null;
  companyId: string | null;
  createdAt: string;
}

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("hrms_admin_token"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"companies" | "users">("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const headers = (): HeadersInit => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Login failed"); }
      const data = await res.json();
      localStorage.setItem("hrms_admin_token", data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/companies`, { headers: headers() });
      if (res.ok) setCompanies(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: headers() });
      if (res.ok) setUsers(await res.json());
    } catch {}
    setLoading(false);
  };

  const toggleCompany = async (id: string) => {
    const res = await fetch(`${API}/api/admin/companies/${id}/toggle`, { method: "PATCH", headers: headers() });
    if (res.ok) fetchCompanies();
  };

  const toggleUser = async (id: string) => {
    const res = await fetch(`${API}/api/admin/users/${id}/toggle`, { method: "PATCH", headers: headers() });
    if (res.ok) fetchUsers();
  };

  const changeRole = async (id: string, role: string) => {
    const res = await fetch(`${API}/api/admin/users/${id}/role`, { method: "PUT", headers: headers(), body: JSON.stringify({ role }) });
    if (res.ok) fetchUsers();
  };

  const logout = () => {
    localStorage.removeItem("hrms_admin_token");
    setToken(null);
  };

  useEffect(() => {
    if (token) {
      fetchCompanies();
      fetchUsers();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Super Admin Login</h1>
            <p className="text-gray-400 mb-6">Sign in to manage all companies and users.</p>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 ml-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white" placeholder="superadmin@hrms.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 px-4 bg-gray-800 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-white" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all">Sign In</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-lg text-white">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to App</a>
            <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => setTab("companies")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === "companies" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            <Building2 className="w-4 h-4" /> Companies
          </button>
          <button onClick={() => setTab("users")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === "users" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
            <Users className="w-4 h-4" /> Users
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "companies" ? "Search companies..." : "Search users..."} className="w-full h-10 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-xl outline-none focus:border-indigo-500 text-gray-200 text-sm" />
        </div>

        {tab === "companies" && (
          <div className="space-y-3">
            {companies.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase())).map((c) => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-sm text-gray-400">{c.email} | {c.userCount} users | Slug: {c.slug}</p>
                </div>
                <button onClick={() => toggleCompany(c.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${c.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {c.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {c.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
            {companies.length === 0 && !loading && <p className="text-gray-500 text-center py-8">No companies found.</p>}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{u.name}</h3>
                  <p className="text-sm text-gray-400">{u.email} | Role: {u.role} | Company: {u.companyName || "N/A"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 px-2 py-1.5 outline-none">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => toggleUser(u.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${u.isActive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {u.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && !loading && <p className="text-gray-500 text-center py-8">No users found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
