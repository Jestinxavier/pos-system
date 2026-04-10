import { Check, Type } from "lucide-react";
import { useSettings } from "@/lib/settings";

export default function Settings() {
  const { fontMode, setFontMode } = useSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Choose a reading mode that feels comfortable for billing and daily operations.
        </p>
      </div>

      <section className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Type size={18} className="text-primary" />
          <h2 className="text-lg font-display font-semibold text-foreground">Font Visibility</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          High mode increases overall text size and default font weight across the app.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFontMode("normal")}
            className={`rounded-lg border p-4 text-left transition-all ${
              fontMode === "normal"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Normal Font</p>
              {fontMode === "normal" && <Check size={16} className="text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Standard text size and weight.</p>
          </button>

          <button
            type="button"
            onClick={() => setFontMode("high")}
            className={`rounded-lg border p-4 text-left transition-all ${
              fontMode === "high"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">High Font</p>
              {fontMode === "high" && <Check size={16} className="text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bigger text and stronger weight for better readability.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
}

