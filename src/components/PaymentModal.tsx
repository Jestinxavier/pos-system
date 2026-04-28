import { useState } from 'react';
import { X, Banknote, Smartphone, CreditCard, Check, Trash2 } from 'lucide-react';
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
    setKeypadOpen(false);
    
    const val = parseFloat(keypadValue);
    if (val && val > 0) {
      setPayments((prev) => [...prev, { method: activeMethod, amount: val }]);
      setAmount('');
    } else {
      setAmount(keypadValue);
    }
  };

  const quickAmounts = [50, 100, 200, 500, remaining > 0 ? Math.ceil(remaining) : 0].filter((v) => v > 0);

  const methods = [
    { key: 'cash' as const, label: 'Cash', icon: Banknote, color: 'text-emerald-500' },
    { key: 'upi' as const, label: 'UPI', icon: Smartphone, color: 'text-violet-500' },
    { key: 'card' as const, label: 'Card', icon: CreditCard, color: 'text-sky-500' },
  ];

  const methodColors: Record<string, string> = {
    cash: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    upi: 'bg-violet-500/10 text-violet-600 border-violet-200',
    card: 'bg-sky-500/10 text-sky-600 border-sky-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-5xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select method and enter amount</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT: Input panel ── */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto border-r border-border">

            {/* Payment method tabs */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setActiveMethod(m.key)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-medium transition-all ${
                      activeMethod === m.key
                        ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <m.icon size={22} />
                    <span className="text-sm">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Amount — <span className="capitalize">{activeMethod}</span>
              </p>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={amount}
                  readOnly
                  onClick={openKeypad}
                  onFocus={openKeypad}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-input text-lg font-semibold bg-background focus:outline-none focus:border-primary cursor-pointer"
                />
                <button
                  onClick={addPayment}
                  disabled={isSaving || !amount}
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-all min-w-[110px]"
                >
                  + Add
                </button>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q.toString())}
                    className="px-4 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/70 transition-all border border-border"
                  >
                    ₹{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Payments received list */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Payments Received {payments.length > 0 && `(${payments.length})`}
              </p>
              {payments.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-border px-4 py-6 text-center text-muted-foreground text-sm">
                  No payments added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 border ${methodColors[p.method]}`}
                    >
                      <div className="flex items-center gap-2">
                        {p.method === 'cash' && <Banknote size={16} />}
                        {p.method === 'upi' && <Smartphone size={16} />}
                        {p.method === 'card' && <CreditCard size={16} />}
                        <span className="capitalize font-medium text-sm">{p.method}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">₹{p.amount.toFixed(2)}</span>
                        <button
                          onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Summary panel ── */}
          <div className="w-72 flex-shrink-0 flex flex-col p-6 bg-muted/30">

            {/* Order total */}
            <div className="gradient-brand rounded-2xl p-5 text-center mb-5">
              <p className="text-sm text-primary-foreground/70 mb-1">Order Total</p>
              <p className="text-4xl font-display font-bold text-primary-foreground leading-none">
                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Summary rows */}
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="font-semibold text-foreground">₹{totalPaid.toFixed(2)}</span>
              </div>

              {remaining > 0 && (
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Remaining</span>
                  <span className="font-bold text-destructive text-base">₹{remaining.toFixed(2)}</span>
                </div>
              )}

              {change > 0 && (
                <div className="flex justify-between items-center rounded-xl bg-emerald-500/10 border border-emerald-200 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-700">Change</span>
                  <span className="font-bold text-emerald-700 text-xl">₹{change.toFixed(2)}</span>
                </div>
              )}

              {isComplete && change === 0 && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-200 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-emerald-700">✓ Fully Paid</span>
                </div>
              )}
            </div>

            {/* Complete button */}
            <button
              onClick={() => isComplete && !isSaving && onComplete(payments)}
              disabled={!isComplete || isSaving}
              className={`mt-5 w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                isComplete && !isSaving
                  ? 'gradient-brand text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Check size={20} />
              {isSaving ? 'Saving...' : 'Complete Order'}
            </button>
          </div>
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
