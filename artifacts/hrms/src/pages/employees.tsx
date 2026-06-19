import { useState, useEffect } from "react";
import {
  useListEmployees,
  useCreateEmployee,
  useDeleteEmployee,
} from "@workspace/api-client-react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Employees() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch(`${BASE}/api/departments`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setDepartments(d);
      })
      .catch(() => {});
  }, []);

  const { data, isLoading, refetch } = useListEmployees({
    search: debouncedSearch || undefined,
    department: deptFilter || undefined,
    page: page,
    limit: 15,
  });
  const deleteMutation = useDeleteEmployee({
    mutation: { onSuccess: () => refetch() },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openAdd = () => {
    setEditingEmp(null);
    setShowModal(true);
  };
  const openEdit = (emp: any) => {
    setEditingEmp(emp);
    setShowModal(true);
  };

  const totalPages = Math.ceil((data?.total || 0) / 15);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Employee Directory
          </h1>
          <p className="text-muted-foreground">
            Manage your workforce, roles, and access.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Employee
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex gap-4 bg-secondary/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading employees...
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-wider text-xs font-semibold text-muted-foreground bg-secondary/40 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role & Dept</th>
                  <th className="px-6 py-4">Status</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data?.employees?.map((emp: any) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-secondary/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {emp.firstName?.charAt(0)}
                          {emp.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {emp.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" /> {emp.email}
                        </span>
                        {emp.phone && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" /> {emp.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                          {emp.designation || "N/A"}
                        </span>
                        <span className="text-muted-foreground">
                          {emp.departmentName || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          emp.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : emp.status === "on_leave"
                              ? "bg-accent/10 text-accent-foreground border-accent/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {(emp.status || "").replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(emp)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {(!data?.employees || data.employees.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/10">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * 15 + 1} to{" "}
            {Math.min(page * 15, data?.total || 0)} of {data?.total || 0}{" "}
            entries
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EmployeeFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEmp(null);
        }}
        employee={editingEmp}
        departments={departments}
        onSuccess={() => {
          setShowModal(false);
          setEditingEmp(null);
          refetch();
        }}
      />
    </div>
  );
}

function EmployeeFormModal({
  open,
  onClose,
  employee,
  departments,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  employee: any;
  departments: { id: number; name: string }[];
  onSuccess: () => void;
}) {
  const isEdit = !!employee;
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    departmentId: "",
    designation: "",
    role: "employee",
    joinDate: "",
    salary: "",
    gender: "",
    password: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        departmentId: employee.departmentId
          ? String(employee.departmentId)
          : "",
        designation: employee.designation || "",
        role: employee.role || "employee",
        joinDate: employee.joinDate || "",
        salary: employee.salary ? String(employee.salary) : "",
        gender: employee.gender || "",
        password: "",
        status: employee.status || "active",
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        departmentId: "",
        designation: "",
        role: "employee",
        joinDate: new Date().toISOString().split("T")[0],
        salary: "",
        gender: "",
        password: "",
        status: "active",
      });
    }
    setError("");
  }, [employee, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.lastName || !form.email) {
      setError("First name, last name, and email are required.");
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        designation: form.designation || null,
        role: form.role,
        joinDate: form.joinDate || null,
        salary: form.salary ? Number(form.salary) : null,
        gender: form.gender || null,
      };
      if (!isEdit && form.password) body.password = form.password;
      if (isEdit) body.status = form.status;

      const url = isEdit
        ? `${BASE}/api/employees/${employee.id}`
        : `${BASE}/api/employees`;
      const resp = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hrms_token")}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || "Failed to save employee",
        );
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Employee" : "Add New Employee"}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">First Name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Last Name *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Department</label>
            <select
              value={form.departmentId}
              onChange={(e) => set("departmentId", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
              placeholder="e.g. Software Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Join Date</label>
            <input
              type="date"
              value={form.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Salary</label>
            <input
              type="number"
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
              placeholder="50000"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Login Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-primary text-sm"
                placeholder="Set login password"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEdit ? "Update Employee" : "Add Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
