import { useState } from 'react';
import { X, Banknote, Smartphone, CreditCard, Check } from 'lucide-react';
import type { PaymentMethod } from '@/lib/store';
import NumericKeypadModal from '@/components/NumericKeypadModal';

interface Props {
  subtotal: number;
  onClose: () => void;
  onComplete: (payments: PaymentMethod[]) => void;
  isSaving?: boolean;
}

export default function PaymentModal({ subtotal, onClose, onComplete, isSaving = false }: Props) {
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [activeMethod, setActiveMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [amount, setAmount] = useState('');
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, subtotal - totalPaid);
  const change = Math.max(0, totalPaid - subtotal);
  const isComplete = totalPaid >= subtotal;

  const addPayment = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setPayments((prev) => [...prev, { method: activeMethod, amount: val }]);
    setAmount('');
  };

  const openKeypad = () => {
    setKeypadValue(amount);
    setKeypadOpen(true);
  };

  const confirmKeypad = () => {
    setAmount(keypadValue);
    setKeypadOpen(false);
  };

  const quickAmounts = [50, 100, 200, 500, remaining > 0 ? Math.ceil(remaining) : 0].filter((v) => v > 0);

  const methods = [
    { key: 'cash' as const, label: 'Cash', icon: Banknote },
    { key: 'upi' as const, label: 'UPI', icon: Smartphone },
    { key: 'card' as const, label: 'Card', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">Payment</h2>
          <button onClick={onClose} disabled={isSaving} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="text-center gradient-brand rounded-xl p-4">
            <p className="text-sm text-primary-foreground/70">Total Amount</p>
            <p className="text-3xl font-display font-bold text-primary-foreground">
              ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Payment method tabs */}
          <div className="flex gap-2">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => setActiveMethod(m.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg text-xs font-medium transition-all ${
                  activeMethod === m.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Enter amount ({activeMethod})</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                readOnly
                onClick={openKeypad}
                onFocus={openKeypad}
                placeholder="0.00"
                className="flex-1 px-4 py-2.5 rounded-lg border border-input text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={addPayment} disabled={isSaving} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                Add
              </button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q.toString())}
                  className="px-3 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80"
                >
                  ₹{q}
                </button>
              ))}
            </div>
          </div>

          {/* Payments list */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Payments received:</p>
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm">
                  <span className="capitalize text-foreground">{p.method}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">₹{p.amount.toFixed(2)}</span>
                    <button
                      onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))}
                      className="text-destructive/60 hover:text-destructive"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Paid</span>
              <span className="font-semibold text-foreground">₹{totalPaid.toFixed(2)}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold text-destructive">₹{remaining.toFixed(2)}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-sm bg-success/10 rounded-lg px-3 py-2">
                <span className="text-success font-medium">Change to return</span>
                <span className="font-bold text-success text-lg">₹{change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => isComplete && !isSaving && onComplete(payments)}
            disabled={!isComplete || isSaving}
            className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              isComplete && !isSaving
                ? 'gradient-brand text-primary-foreground hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Check size={18} />
            {isSaving ? 'Saving...' : 'Complete Order'}
          </button>
        </div>
      </div>

      <NumericKeypadModal
        open={keypadOpen}
        title={`Enter amount (${activeMethod})`}
        value={keypadValue}
        onChange={setKeypadValue}
        onClose={() => setKeypadOpen(false)}
        onConfirm={confirmKeypad}
      />
    </div>
  );
}
