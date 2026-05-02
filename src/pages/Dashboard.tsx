import { useMemo, useState } from 'react';
import { type Order } from '@/lib/store';
import { useData } from '@/lib/data';
import KPICard from '@/components/KPICard';
import { IndianRupee, ShoppingBag, TrendingUp, Banknote, Smartphone, CreditCard, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { printReceipt } from '@/lib/posbridge';
import { toast } from 'sonner';

type Period = 'today' | 'week' | 'month' | 'all';

function filterByPeriod(orders: Order[], period: Period): Order[] {
  const now = new Date();
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

const COLORS = ['hsl(134, 45%, 33%)', 'hsl(42, 45%, 55%)', 'hsl(210, 100%, 50%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('today');
  const { orders: allOrders, loadingOrders, ordersError } = useData();
  const orders = useMemo(() => filterByPeriod(allOrders, period), [allOrders, period]);
  const todayOrders = useMemo(() => filterByPeriod(allOrders, 'today'), [allOrders]);

  if (loadingOrders) {
    return (
      <div className="text-sm text-muted-foreground">Loading dashboard...</div>
    );
  }
  if (ordersError) {
    return <div className="text-sm text-destructive">Failed to load data: {ordersError}</div>;
  }

  const totalSales = orders.reduce((s, o) => s + o.subtotal, 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  const cashTotal = orders.reduce((s, o) => s + o.payments.filter((p) => p.method === 'cash').reduce((a, p) => a + p.amount, 0), 0);
  const upiTotal = orders.reduce((s, o) => s + o.payments.filter((p) => p.method === 'upi').reduce((a, p) => a + p.amount, 0), 0);
  const cardTotal = orders.reduce((s, o) => s + o.payments.filter((p) => p.method === 'card').reduce((a, p) => a + p.amount, 0), 0);
  const todayCashPayments = todayOrders.flatMap((o) => o.payments.filter((p) => p.method === 'cash'));
  const todayUpiPayments = todayOrders.flatMap((o) => o.payments.filter((p) => p.method === 'upi'));
  const todayCardPayments = todayOrders.flatMap((o) => o.payments.filter((p) => p.method === 'card'));
  const todayCashTotal = todayCashPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayUpiTotal = todayUpiPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayCardTotal = todayCardPayments.reduce((sum, p) => sum + p.amount, 0);
  const todayMiniStatementRows = todayOrders.flatMap((order) =>
    order.payments.map((payment, index) => ({
      key: `${order.id}-${index}`,
      orderId: order.id,
      time: new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      method: formatPaymentMethod(payment.method),
      amount: payment.amount,
    }))
  );
  const todayGrandTotal = todayMiniStatementRows.reduce((sum, row) => sum + row.amount, 0);

  const paymentData = [
    { name: 'Cash', value: cashTotal },
    { name: 'UPI', value: upiTotal },
    { name: 'Card', value: cardTotal },
  ].filter((d) => d.value > 0);

  // Top products
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  orders.forEach((o) =>
    o.items.forEach((item) => {
      const existing = productMap.get(item.product.id) || { name: item.product.name, qty: 0, revenue: 0 };
      existing.qty += item.mode === 'quantity' ? item.quantity : item.weight;
      existing.revenue += item.total;
      productMap.set(item.product.id, existing);
    })
  );
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  const handlePrintMiniStatement = async () => {
    const bridgePayload = {
      invoiceNo: `STM-${new Date().toISOString().slice(0, 10)}`,
      cashier: 'Counter',
      items: todayMiniStatementRows.map((row) => ({
        name: `${row.time} ${row.method} #${row.orderId.slice(-6)}`,
        qty: 1,
        price: row.amount,
      })),
      subtotal: todayGrandTotal,
      total: todayGrandTotal,
      paymentMethod: 'MIXED',
      amountPaid: todayGrandTotal,
      change: 0,
      openDrawer: false,
      note: 'TODAY MINI STATEMENT',
    };

    const toastId = toast.loading('Printing mini statement...');
    const bridgeResult = await printReceipt(bridgePayload);
    if (bridgeResult.ok) {
      toast.success('Mini statement printed to label printer.', { id: toastId });
      return;
    }

    toast.warning('POS Bridge unavailable. Opening browser print preview instead.', { id: toastId });

    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) return;

    const todayLabel = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const rowsHtml =
      todayMiniStatementRows.length === 0
        ? `<tr><td colspan="4" style="text-align:center;padding:8px 0;">No transactions today</td></tr>`
        : todayMiniStatementRows
            .map(
              (row) => `
              <tr>
                <td>${row.orderId.slice(-6)}</td>
                <td>${row.time}</td>
                <td>${row.method}</td>
                <td style="text-align:right;">₹${row.amount.toFixed(2)}</td>
              </tr>
            `
            )
            .join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Today Mini Statement</title>
        <style>
          @page { size: 80mm auto; margin: 6mm; }
          body { font-family: Arial, sans-serif; margin: 0; color: #111; }
          .label { width: 100%; max-width: 80mm; margin: 0 auto; font-size: 12px; }
          h1 { font-size: 14px; margin: 0; text-align: center; }
          .sub { text-align: center; margin: 2px 0 8px; font-size: 11px; }
          .line { border-top: 1px dashed #444; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { font-size: 11px; padding: 4px 0; vertical-align: top; }
          th { text-align: left; border-bottom: 1px dashed #444; }
          .total { font-weight: 700; font-size: 12px; display: flex; justify-content: space-between; margin-top: 8px; }
          .foot { margin-top: 8px; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="label">
          <h1>ST.XAVIER OILS</h1>
          <div class="sub">Today Mini Statement - ${todayLabel}</div>
          <div class="line"></div>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Time</th>
                <th>Mode</th>
                <th style="text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="line"></div>
          <div class="total">
            <span>Grand Total</span>
            <span>₹${todayGrandTotal.toFixed(2)}</span>
          </div>
          <div class="foot">Generated from Dashboard</div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Business overview & insights</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={IndianRupee} title="Total Sales" value={`₹${totalSales.toLocaleString('en-IN')}`} variant="primary" subtitle={`${totalOrders} orders`} />
        <KPICard icon={ShoppingBag} title="Total Orders" value={totalOrders.toString()} subtitle="completed" />
        <KPICard icon={TrendingUp} title="Avg Order Value" value={`₹${avgOrder.toFixed(0)}`} variant="gold" />
        <KPICard icon={Banknote} title="Cash Collection" value={`₹${cashTotal.toLocaleString('en-IN')}`} />
      </div>

      {/* Today transaction KPIs */}
      <div className="space-y-2">
        <h3 className="font-display font-semibold text-foreground">Today Transactions (Payment Mode)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            icon={Smartphone}
            title="UPI / GPay"
            value={`₹${todayUpiTotal.toLocaleString('en-IN')}`}
            subtitle={`${todayUpiPayments.length} transactions`}
          />
          <KPICard
            icon={Banknote}
            title="Cash"
            value={`₹${todayCashTotal.toLocaleString('en-IN')}`}
            subtitle={`${todayCashPayments.length} transactions`}
          />
          <KPICard
            icon={CreditCard}
            title="Card / Bank"
            value={`₹${todayCardTotal.toLocaleString('en-IN')}`}
            subtitle={`${todayCardPayments.length} transactions`}
          />
        </div>
      </div>

      {/* Payment & Product charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment breakdown */}
        <div className="bg-card rounded-xl shadow-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Payment Breakdown</h3>
          {paymentData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 flex-1">
                <PaymentRow icon={Banknote} label="Cash" amount={cashTotal} color={COLORS[0]} />
                <PaymentRow icon={Smartphone} label="UPI" amount={upiTotal} color={COLORS[1]} />
                <PaymentRow icon={CreditCard} label="Card" amount={cardTotal} color={COLORS[2]} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No payment data yet</p>
          )}
        </div>

        {/* Top products */}
        <div className="bg-card rounded-xl shadow-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120, 15%, 88%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`₹${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(134, 45%, 33%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No product data yet</p>
          )}
        </div>
      </div>

      {/* Today mini statement */}
      <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-semibold text-foreground">Today Mini Statement</h3>
            <p className="text-sm text-muted-foreground">Order-wise payment mode, time and amount (label print format).</p>
          </div>
          <Button onClick={handlePrintMiniStatement} className="gap-2">
            <Printer size={16} />
            Print Mini Statement
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Order</th>
                <th className="text-left px-3 py-2 font-medium">Time</th>
                <th className="text-left px-3 py-2 font-medium">Payment Mode</th>
                <th className="text-right px-3 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {todayMiniStatementRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No transactions for today yet
                  </td>
                </tr>
              ) : (
                todayMiniStatementRows.map((row) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-3 py-2">{row.orderId}</td>
                    <td className="px-3 py-2">{row.time}</td>
                    <td className="px-3 py-2">{row.method}</td>
                    <td className="px-3 py-2 text-right font-medium">₹{row.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/40">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold">Grand Total Today</td>
                <td className="px-3 py-2 text-right font-bold">₹{todayGrandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatPaymentMethod(method: 'cash' | 'upi' | 'card') {
  if (method === 'upi') return 'UPI / GPay';
  if (method === 'card') return 'Card / Bank';
  return 'Cash';
}

function PaymentRow({ icon: Icon, label, amount, color }: { icon: typeof Banknote; label: string; amount: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <Icon size={14} className="text-muted-foreground" />
      <span className="text-sm text-foreground flex-1">{label}</span>
      <span className="text-sm font-semibold text-foreground">₹{amount.toLocaleString('en-IN')}</span>
    </div>
  );
}
