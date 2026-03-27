import { useState, useEffect } from "react";
import { FileText, Plus, Eye, Download, Loader2, Trash2, Edit2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/use-auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("hrms_token")}` });

const DEFAULT_TEMPLATES = [
  { name: "Offer Letter", type: "offer_letter", content: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
<h1 style="color: #1e40af; margin: 0;">{{company_name}}</h1>
<p style="color: #666; margin: 5px 0 0 0;">Offer of Employment</p></div>
<p><strong>Date:</strong> {{date}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>We are pleased to offer you the position of <strong>{{designation}}</strong> in our <strong>{{department}}</strong> department. This offer is contingent upon successful completion of our standard background verification process.</p>
<h3 style="color: #1e40af;">Position Details</h3>
<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold; width: 40%;">Position</td><td style="padding: 8px; border: 1px solid #ddd;">{{designation}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Department</td><td style="padding: 8px; border: 1px solid #ddd;">{{department}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">CTC (Annual)</td><td style="padding: 8px; border: 1px solid #ddd;">₹{{salary}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Joining Date</td><td style="padding: 8px; border: 1px solid #ddd;">{{join_date}}</td></tr>
<tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Reporting To</td><td style="padding: 8px; border: 1px solid #ddd;">{{reporting_manager}}</td></tr>
</table>
<p>Please confirm your acceptance within 7 days of receiving this letter.</p>
<p>We look forward to welcoming you aboard.</p>
<br/><p>Sincerely,<br/><strong>{{hr_name}}</strong><br/>HR Department<br/>{{company_name}}</p></div>`,
    variables: ["employee_name","designation","department","salary","join_date","reporting_manager","hr_name","company_name","date"] },
  { name: "Experience Letter", type: "experience_letter", content: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
<h1 style="color: #1e40af; margin: 0;">{{company_name}}</h1>
<p style="color: #666; margin: 5px 0 0 0;">Experience Certificate</p></div>
<p><strong>Date:</strong> {{date}}</p>
<p><strong>To Whom It May Concern</strong></p>
<p>This is to certify that <strong>{{employee_name}}</strong> (Employee Code: {{employee_code}}) was employed with {{company_name}} from <strong>{{join_date}}</strong> to <strong>{{last_working_date}}</strong> as <strong>{{designation}}</strong> in the <strong>{{department}}</strong> department.</p>
<p>During their tenure, {{employee_name}} demonstrated excellent professional skills and dedication. Their performance was consistently outstanding.</p>
<p>We wish them all the best in their future endeavours.</p>
<br/><p>For <strong>{{company_name}}</strong><br/><br/><strong>{{hr_name}}</strong><br/>HR Department</p></div>`,
    variables: ["employee_name","employee_code","designation","department","join_date","last_working_date","hr_name","company_name","date"] },
  { name: "Relieving Letter", type: "relieving_letter", content: `<div style="font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px;">
<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
<h1 style="color: #1e40af; margin: 0;">{{company_name}}</h1>
<p style="color: #666; margin: 5px 0 0 0;">Relieving Letter</p></div>
<p><strong>Date:</strong> {{date}}</p>
<p>Dear <strong>{{employee_name}}</strong>,</p>
<p>This is to inform you that your resignation has been accepted and you are hereby relieved from your duties at {{company_name}} effective <strong>{{last_working_date}}</strong>.</p>
<p>All dues have been settled as per company policy. We thank you for your contributions during your tenure with us.</p>
<br/><p>For <strong>{{company_name}}</strong><br/><br/><strong>{{hr_name}}</strong><br/>HR Department</p></div>`,
    variables: ["employee_name","last_working_date","hr_name","company_name","date"] },
];

export default function Documents() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [generated, setGenerated] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPreview, setShowPreview] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"templates" | "generated">("templates");

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, gRes, eRes] = await Promise.all([
        fetch(`${BASE}/api/documents/templates`, { headers: headers() }),
        fetch(`${BASE}/api/documents/generated`, { headers: headers() }),
        fetch(`${BASE}/api/employees?limit=100`, { headers: headers() }),
      ]);
      setTemplates(await tRes.json());
      setGenerated(await gRes.json());
      const empData = await eRes.json();
      setEmployees(empData?.employees || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const seedTemplates = async () => {
    for (const t of DEFAULT_TEMPLATES) {
      await fetch(`${BASE}/api/documents/templates`, {
        method: "POST", headers: headers(),
        body: JSON.stringify(t),
      });
    }
    fetchAll();
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`${BASE}/api/documents/templates/${id}`, { method: "DELETE", headers: headers() });
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Create and manage HR document templates.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            {templates.length === 0 && (
              <button onClick={seedTemplates} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-accent/20 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Load Default Templates
              </button>
            )}
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-secondary text-foreground rounded-xl text-sm font-semibold glass-btn border border-border flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Template
            </button>
            <button onClick={() => setShowGenerate(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold glass-btn shadow-lg shadow-primary/20 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Generate Document
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 glass-card rounded-xl w-max">
        <button onClick={() => setTab("templates")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "templates" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>Templates ({templates.length})</button>
        <button onClick={() => setTab("generated")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "generated" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}>Generated ({generated.length})</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : tab === "templates" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText className="w-5 h-5" /></div>
                  <div>
                    <h4 className="font-semibold text-sm">{t.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{t.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {(t.variables || []).slice(0, 5).map((v: string) => (
                  <span key={v} className="px-2 py-0.5 bg-secondary rounded-md text-[10px] font-medium text-muted-foreground">{`{{${v}}}`}</span>
                ))}
                {(t.variables || []).length > 5 && <span className="px-2 py-0.5 text-[10px] text-muted-foreground">+{t.variables.length - 5}</span>}
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No templates yet. Click "Load Default Templates" to get started.</div>}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/30">
                <tr>
                  <th className="px-4 md:px-6 py-3">Document</th>
                  <th className="px-4 md:px-6 py-3 hidden sm:table-cell">Employee</th>
                  <th className="px-4 md:px-6 py-3 hidden md:table-cell">Date</th>
                  <th className="px-4 md:px-6 py-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {generated.map(doc => (
                  <tr key={doc.id} className="hover:bg-secondary/10">
                    <td className="px-4 md:px-6 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate max-w-[200px]">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 hidden sm:table-cell text-muted-foreground">{doc.employeeName}</td>
                    <td className="px-4 md:px-6 py-3 hidden md:table-cell text-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-4 md:px-6 py-3 text-right">
                      <button onClick={() => setShowPreview(doc)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {generated.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">No documents generated yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GenerateDocModal open={showGenerate} onClose={() => setShowGenerate(false)} templates={templates} employees={employees} onSuccess={() => { setShowGenerate(false); setTab("generated"); fetchAll(); }} />
      <CreateTemplateModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchAll(); }} />
      
      <Modal open={!!showPreview} onClose={() => setShowPreview(null)} title={showPreview?.name || "Document"} maxWidth="max-w-3xl">
        {showPreview && (
          <div>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: showPreview.content }} />
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border/50">
              <button onClick={() => {
                const w = window.open('', '_blank');
                if (w) { w.document.write(showPreview.content); w.document.close(); w.print(); }
              }} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2">
                <Download className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function GenerateDocModal({ open, onClose, templates, employees, onSuccess }: any) {
  const [form, setForm] = useState({ templateId: "", employeeId: "", variables: {} as Record<string, string> });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ templateId: "", employeeId: "", variables: {} }); setError(""); }, [open]);

  const selectedTemplate = templates.find((t: any) => t.id === Number(form.templateId));
  const customVars = (selectedTemplate?.variables || []).filter((v: string) => !["employee_name","first_name","last_name","employee_code","email","phone","designation","department","join_date","salary","date","company_name"].includes(v));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.templateId || !form.employeeId) { setError("Select template and employee."); return; }
    setSaving(true);
    try {
      const resp = await fetch(`${BASE}/api/documents/generate`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ templateId: Number(form.templateId), employeeId: Number(form.employeeId), variables: form.variables }),
      });
      if (!resp.ok) throw new Error("Failed to generate document");
      onSuccess();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Template</label>
          <select value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
            <option value="">Select Template</option>
            {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Employee</label>
          <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
            <option value="">Select Employee</option>
            {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeCode})</option>)}
          </select>
        </div>
        {customVars.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Additional Details</p>
            {customVars.map((v: string) => (
              <div key={v} className="space-y-1">
                <label className="text-xs font-medium capitalize">{v.replace(/_/g, ' ')}</label>
                <input type="text" value={form.variables[v] || ""} onChange={e => setForm(f => ({ ...f, variables: { ...f.variables, [v]: e.target.value } }))} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm" placeholder={`Enter ${v.replace(/_/g, ' ')}`} />
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Generate
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateTemplateModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ name: "", type: "custom", content: "", variablesStr: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setForm({ name: "", type: "custom", content: "", variablesStr: "" }); setError(""); }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.content) { setError("Name and content are required."); return; }
    setSaving(true);
    try {
      const variables = form.variablesStr.split(",").map(v => v.trim()).filter(Boolean);
      const resp = await fetch(`${BASE}/api/documents/templates`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ name: form.name, type: form.type, content: form.content, variables }),
      });
      if (!resp.ok) throw new Error("Failed to create template");
      onSuccess();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Template" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" placeholder="e.g. Appraisal Letter" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm">
              <option value="offer_letter">Offer Letter</option>
              <option value="experience_letter">Experience Letter</option>
              <option value="relieving_letter">Relieving Letter</option>
              <option value="appraisal_letter">Appraisal Letter</option>
              <option value="warning_letter">Warning Letter</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Variables (comma-separated)</label>
          <input type="text" value={form.variablesStr} onChange={e => setForm(f => ({ ...f, variablesStr: e.target.value }))} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" placeholder="hr_name, reporting_manager" />
          <p className="text-[10px] text-muted-foreground">Auto-filled: employee_name, designation, department, salary, join_date, email, date, company_name</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Content (HTML)</label>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono resize-none" placeholder={'Use {{variable_name}} for placeholders'} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create Template
          </button>
        </div>
      </form>
    </Modal>
  );
}
