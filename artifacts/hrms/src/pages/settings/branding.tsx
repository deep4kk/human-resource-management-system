import { useState, useEffect } from "react";
import { useGetBranding, useUpdateBranding } from "@workspace/api-client-react";
import {
  Palette,
  Image as ImageIcon,
  Type,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function BrandingSettings() {
  const { data: branding, isLoading } = useGetBranding();
  const updateMutation = useUpdateBranding();
  const [successMsg, setSuccessMsg] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    logoUrl: "",
    primaryColor: "",
    accentColor: "",
    theme: "system" as "light" | "dark" | "system",
  });

  useEffect(() => {
    if (branding) {
      setForm({
        companyName: branding.companyName,
        logoUrl: branding.logoUrl || "",
        primaryColor: branding.primaryColor,
        accentColor: branding.accentColor,
        theme: branding.theme,
      });
    }
  }, [branding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      { data: form },
      {
        onSuccess: () => {
          setSuccessMsg(true);
          setTimeout(() => setSuccessMsg(false), 3000);
          // Force reload to apply theme changes everywhere smoothly
          window.location.reload();
        },
      },
    );
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Branding Settings
        </h1>
        <p className="text-muted-foreground">
          Customize the look and feel of the HRMS portal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Settings saved successfully.
              Reloading...
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="glass-card p-8 rounded-2xl space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Type className="w-4 h-4" /> Company Name
              </label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Logo URL
              </label>
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Primary Color (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                    className="h-12 w-12 rounded-xl cursor-pointer bg-transparent border-0 p-1"
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm({ ...form, primaryColor: e.target.value })
                    }
                    className="flex-1 h-12 px-4 rounded-xl border border-border bg-background uppercase font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Accent Color (Hex)
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) =>
                      setForm({ ...form, accentColor: e.target.value })
                    }
                    className="h-12 w-12 rounded-xl cursor-pointer bg-transparent border-0 p-1"
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={(e) =>
                      setForm({ ...form, accentColor: e.target.value })
                    }
                    className="flex-1 h-12 px-4 rounded-xl border border-border bg-background uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-3">
              <label className="text-sm font-semibold block">
                Default Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["light", "dark", "system"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, theme: t as any })}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                      form.theme === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full mt-6 h-12 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> Save Changes
            </button>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div>
          <div
            className="sticky top-28 glass-card rounded-2xl p-6 border-2"
            style={{ borderColor: form.primaryColor }}
          >
            <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">
              Live Preview
            </h3>

            <div className="p-4 rounded-xl bg-background border shadow-sm mb-4">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-8 object-contain mb-4"
                />
              ) : (
                <div
                  className="font-display font-bold text-xl mb-4"
                  style={{ color: form.primaryColor }}
                >
                  {form.companyName || "Company Name"}
                </div>
              )}

              <div className="h-2 w-full rounded-full bg-secondary mb-2 overflow-hidden">
                <div
                  className="h-full w-2/3"
                  style={{ backgroundColor: form.primaryColor }}
                ></div>
              </div>

              <button
                className="w-full py-2 mt-4 rounded-lg font-medium text-white text-sm"
                style={{ backgroundColor: form.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="w-full py-2 mt-2 rounded-lg font-medium text-white text-sm"
                style={{ backgroundColor: form.accentColor }}
              >
                Accent Button
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Changes apply on save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
