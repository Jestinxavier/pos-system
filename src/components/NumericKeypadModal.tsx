import { X, Delete } from "lucide-react";

interface Props {
  open: boolean;
  title?: string;
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "00"];

export default function NumericKeypadModal({ open, title, value, onChange, onClose, onConfirm }: Props) {
  if (!open) return null;

  const handleKeyPress = (key: string) => {
    if (key === ".") {
      if (value.includes(".")) return;
      onChange(value ? `${value}.` : "0.");
      return;
    }
    onChange(`${value}${key}`);
  };

  const handleBackspace = () => {
    if (!value) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => onChange("");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-elevated w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-foreground">{title || "Enter amount"}</h3>
            <p className="text-xs text-muted-foreground">Tap numbers to input</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-muted rounded-xl px-4 py-3 text-2xl font-display font-bold text-foreground text-right">
            {value || "0"}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {keys.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="py-3 rounded-lg bg-background border border-border text-lg font-semibold text-foreground hover:bg-accent"
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleClear}
              className="py-3 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent"
            >
              Clear
            </button>
            <button
              onClick={handleBackspace}
              className="py-3 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-accent flex items-center justify-center gap-1"
            >
              <Delete size={16} />
              Back
            </button>
            <button
              onClick={onConfirm}
              className="py-3 rounded-lg gradient-brand text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
