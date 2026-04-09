import { useMemo, useState } from 'react';
import { type Order } from '@/lib/store';
import { useData } from '@/lib/data';
import KPICard from '@/components/KPICard';
import { IndianRupee, ShoppingBag, TrendingUp, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
    </div>
  );
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
