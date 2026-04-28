import { X, Download, Share2, Printer } from 'lucide-react';
import type { Order } from '@/lib/store';
import { toast } from 'sonner';
import { buildPrintPayload, printReceipt } from '@/lib/posbridge';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: Props) {
  const date = new Date(order.createdAt);

  const shareInvoice = () => {
    const text = generateInvoiceText(order);
    if (navigator.share) {
      navigator.share({ title: 'Invoice - St.Xavier Oils', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Invoice copied to clipboard!');
    }
  };

  const downloadInvoice = () => {
    const text = generateInvoiceText(order);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded!');
  };

  const handlePrint = async () => {
    const toastId = toast.loading('Printing receipt...');
    const payload = buildPrintPayload(order);
    payload.openDrawer = false; // Don't pop the cash drawer on reprint
    const result = await printReceipt(payload);
    if (result.ok) {
      toast.success('Receipt printed!', { id: toastId });
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : 'POS Bridge not running on this machine';
      toast.error(`Print failed: ${errorMessage}`, { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-foreground">Invoice</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <h3 className="font-display font-bold text-lg text-foreground">St.Xavier Oils</h3>
            <p className="text-xs text-muted-foreground">Purity You Can See</p>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleDateString('en-IN')} · {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-muted-foreground">Order #{order.id}</p>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <span className="text-foreground">{item.product.name}</span>
                  {getInvoiceItemUnitLabel(item) && (
                    <span className="text-muted-foreground ml-1">× {getInvoiceItemUnitLabel(item)}</span>
                  )}
                </div>
                <span className="font-medium text-foreground">₹{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Payments */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Details</p>
            {order.payments.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="capitalize text-foreground">{p.method}</span>
                <span className="text-foreground">₹{p.amount.toFixed(2)}</span>
              </div>
            ))}
            {order.change > 0 && (
              <div className="flex justify-between text-sm text-success font-medium">
                <span>Change returned</span>
                <span>₹{order.change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-border" />

          <p className="text-center text-xs text-muted-foreground">Thank you for shopping with us!</p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200 text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-500/20"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={downloadInvoice}
              className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent"
            >
              <Download size={16} /> Download
            </button>
            <button
              onClick={shareInvoice}
              className="flex-1 py-2.5 rounded-lg gradient-brand text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateInvoiceText(order: Order): string {
  const date = new Date(order.createdAt);
  let text = `🥥 ST.XAVIER OILS\nPurity You Can See\n`;
  text += `Date: ${date.toLocaleDateString('en-IN')} ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
  text += `Order: #${order.id}\n`;
  text += `─────────────────\n`;
  order.items.forEach((item) => {
    const unitLabel = getInvoiceItemUnitLabel(item);
    text += unitLabel
      ? `${item.product.name} × ${unitLabel} = ₹${item.total.toFixed(2)}\n`
      : `${item.product.name} = ₹${item.total.toFixed(2)}\n`;
  });
  text += `─────────────────\n`;
  text += `TOTAL: ₹${order.subtotal.toFixed(2)}\n`;
  text += `─────────────────\n`;
  order.payments.forEach((p) => {
    text += `${p.method.toUpperCase()}: ₹${p.amount.toFixed(2)}\n`;
  });
  if (order.change > 0) text += `CHANGE: ₹${order.change.toFixed(2)}\n`;
  text += `─────────────────\nThank you! 🙏`;
  return text;
}

function getInvoiceItemUnitLabel(item: Order["items"][number]): string | null {
  if (item.mode === "quantity") {
    return item.quantity > 0 ? `${item.quantity} pc` : null;
  }
  if (item.mode === "weight") {
    return item.weight > 0 ? `${item.weight} ${item.product.unit}` : null;
  }
  return null;
}
