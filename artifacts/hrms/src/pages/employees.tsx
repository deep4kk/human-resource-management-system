import { useState } from "react";
import { useListEmployees, useCreateEmployee, useDeleteEmployee } from "@workspace/api-client-react";
import { Plus, Search, MoreVertical, Edit2, Trash2, Mail, Phone, Briefcase } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Employees() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useListEmployees({ query: { queryKey: ['employees', page] } });
  const deleteMutation = useDeleteEmployee({
    mutation: { onSuccess: () => refetch() }
  });

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground">Manage your workforce, roles, and access.</p>
        </div>
        <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Employee
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex gap-4 bg-secondary/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name or email..." className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm" />
          </div>
          <select className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground">Loading employees...</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="uppercase tracking-wider text-xs font-semibold text-muted-foreground bg-secondary/40 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role & Dept</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data?.employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-muted-foreground">ID: {emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="w-3.5 h-3.5"/> {emp.email}</span>
                        {emp.phone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5"/> {emp.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-muted-foreground"/> {emp.designation || 'N/A'}</span>
                        <span className="text-muted-foreground">{emp.departmentName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        emp.status === 'on_leave' ? 'bg-accent/10 text-accent-foreground border-accent/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {emp.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-secondary/10">
          <span className="text-sm text-muted-foreground">Showing 1 to {data?.employees.length} of {data?.total} entries</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50">Previous</button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
