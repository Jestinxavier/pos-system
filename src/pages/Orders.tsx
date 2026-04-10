import { useEffect, useMemo, useState } from 'react';
import { type Order } from '@/lib/store';
import { useData } from '@/lib/data';
import InvoiceModal from '@/components/InvoiceModal';
import { Receipt, CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

export default function Orders() {
  const { orders, loadingOrders, ordersError } = useData();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(60);

  const filteredOrders = useMemo(() => {
    if (!selectedDate) return orders;
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return (
        createdAt.getFullYear() === selectedDate.getFullYear() &&
        createdAt.getMonth() === selectedDate.getMonth() &&
        createdAt.getDate() === selectedDate.getDate()
      );
    });
  }, [orders, selectedDate]);

  useEffect(() => {
    setVisibleCount(60);
  }, [selectedDate, orders.length]);

  const visibleOrders = useMemo(() => {
    if (selectedDate) return filteredOrders;
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, selectedDate, visibleCount]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    visibleOrders.forEach((o) => {
      const key = new Date(o.createdAt).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const arr = map.get(key) || [];
      arr.push(o);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [visibleOrders]);

  const hasMore = !selectedDate && filteredOrders.length > visibleCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {selectedDate
            ? `${filteredOrders.length} orders on ${selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`
            : `${orders.length} total orders`}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="text-sm text-muted-foreground py-12">Loading orders...</div>
          ) : ordersError ? (
            <div className="text-sm text-destructive py-12">Failed to load orders: {ordersError}</div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-20">
              <Receipt size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No orders found</p>
              <p className="text-xs text-muted-foreground">
                {selectedDate ? 'Try another date or clear filter' : 'Orders will appear here after billing'}
              </p>
            </div>
          ) : (
            <>
              {grouped.map(([date, dayOrders]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarDays size={14} />
                    {date}
                    <span className="text-xs bg-muted rounded-full px-2 py-0.5">{dayOrders.length}</span>
                  </div>
                  <div className="space-y-2">
                    {dayOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="w-full bg-card rounded-xl shadow-card p-4 flex items-center gap-4 text-left hover:shadow-elevated transition-shadow"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          <Receipt size={18} className="text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {order.items.map((i) => i.product.name).join(', ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            · {order.payments.map((p) => p.method).join(' + ')}
                          </p>
                        </div>
                        <p className="font-display font-bold text-foreground">₹{order.subtotal.toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="pt-2">
                  <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + 60)}>
                    Load 60 More Orders
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="bg-card border border-border rounded-xl shadow-card p-3 space-y-3">
            <div className="px-1">
              <h2 className="text-sm font-semibold text-foreground">Filter by Date</h2>
              <p className="text-xs text-muted-foreground">Use calendar to view a single day quickly.</p>
            </div>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="w-full" />
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSelectedDate(undefined)}
              disabled={!selectedDate}
            >
              Clear Date Filter
            </Button>
          </div>
        </div>
      </div>

      {selectedOrder && <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
