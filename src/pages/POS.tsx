import { useState, useCallback } from 'react';
import { type Product, type CartItem, type PaymentMethod, type Order, saveOrder, generateId } from '@/lib/store';
import { Plus, Minus, Trash2, ShoppingCart, Weight, Hash, X, IndianRupee } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';
import InvoiceModal from '@/components/InvoiceModal';
import NumericKeypadModal from '@/components/NumericKeypadModal';
import { toast } from 'sonner';
import { useData } from '@/lib/data';

export default function POS() {
  const { products, loadingProducts, productsError } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const subtotal = cart.reduce((s, item) => s + item.total, 0);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.product.id === product.id);
      if (exists) {
        return prev.map((c) =>
          c.product.id === product.id
            ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * (c.product.pricePerUnit || c.product.pricePerKg) }
            : c
        );
      }
      return [
        ...prev,
        {
          product,
          mode: 'quantity' as const,
          quantity: 1,
          weight: 0,
          total: product.pricePerUnit || product.pricePerKg,
        },
      ];
    });
  }, []);

  const updateCartItem = useCallback((productId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const updated = { ...item, ...updates };
        // Recalculate total
        if (updated.mode === 'quantity') {
          updated.total = updated.quantity * (updated.product.pricePerUnit || updated.product.pricePerKg);
        } else if (updated.mode === 'weight') {
          updated.total = updated.weight * updated.product.pricePerKg;
        }
        // For 'price' mode, total is set directly via the input
        updated.total = Math.round(updated.total * 100) / 100;
        return updated;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }, []);

  const handlePaymentComplete = useCallback(async (payments: PaymentMethod[]) => {
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const order: Order = {
      id: generateId(),
      items: cart,
      subtotal,
      payments,
      totalPaid,
      change: Math.max(0, totalPaid - subtotal),
      createdAt: new Date().toISOString(),
    };
    try {
      setIsSavingOrder(true);
      await saveOrder(order);
      setCart([]);
      setShowPayment(false);
      setCompletedOrder(order);
      toast.success('Order completed!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save order');
    } finally {
      setIsSavingOrder(false);
    }
  }, [cart, subtotal]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-4rem)]">
      {/* Product Grid */}
      <div className="flex-1 space-y-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Select products to add to bill</p>
        </div>

        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {loadingProducts ? (
            <div className="text-sm text-muted-foreground">Loading products...</div>
          ) : productsError ? (
            <div className="text-sm text-destructive">Failed to load products: {productsError}</div>
          ) : (
            filteredProducts.map((product) => (
              <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-card rounded-xl shadow-card p-4 text-left hover:shadow-elevated transition-shadow group"
            >
              <div className="w-full aspect-square rounded-lg bg-accent flex items-center justify-center mb-3 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🥥</span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                ₹{product.pricePerKg}/{product.unit}
                {product.pricePerUnit && ` · ₹${product.pricePerUnit}/pc`}
              </p>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={14} /> Add to bill
              </div>
            </button>
            ))
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 bg-card rounded-xl shadow-card flex flex-col max-h-[calc(100vh-4rem)] sticky top-8">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">Current Bill</h2>
          <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
            {cart.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No items added yet</p>
          ) : (
            cart.map((item) => (
              <CartItemCard
                key={item.product.id}
                item={item}
                onUpdate={(u) => updateCartItem(item.product.id, u)}
                onRemove={() => removeFromCart(item.product.id)}
              />
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-xl font-display font-bold text-foreground">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="w-full py-3 rounded-lg gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          subtotal={subtotal}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
          isSaving={isSavingOrder}
        />
      )}

      {completedOrder && (
        <InvoiceModal order={completedOrder} onClose={() => setCompletedOrder(null)} />
      )}
    </div>
  );
}

function CartItemCard({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (u: Partial<CartItem>) => void;
  onRemove: () => void;
}) {
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');
  const [keypadField, setKeypadField] = useState<'weight' | 'price'>('weight');

  const openKeypad = (field: 'weight' | 'price') => {
    setKeypadField(field);
    const currentValue = field === 'weight' ? item.weight : item.total;
    setKeypadValue(currentValue ? currentValue.toString() : '');
    setKeypadOpen(true);
  };

  const confirmKeypad = () => {
    const num = parseFloat(keypadValue);
    const safeValue = Number.isFinite(num) ? num : 0;
    if (keypadField === 'weight') {
      onUpdate({ weight: safeValue });
    } else {
      onUpdate({ total: safeValue });
    }
    setKeypadOpen(false);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{item.product.name}</h4>
          <p className="text-xs text-muted-foreground">
            ₹{item.mode === 'quantity' ? (item.product.pricePerUnit || item.product.pricePerKg) : item.product.pricePerKg}
            /{item.mode === 'quantity' ? 'pc' : item.product.unit}
          </p>
        </div>
        <button onClick={onRemove} className="text-destructive/60 hover:text-destructive p-1">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-background rounded-md p-0.5">
        <button
          onClick={() => onUpdate({ mode: 'quantity', weight: 0, quantity: item.quantity || 1 })}
          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-all ${
            item.mode === 'quantity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Hash size={12} /> Qty
        </button>
        <button
          onClick={() => onUpdate({ mode: 'weight', quantity: 0, weight: item.weight || 1 })}
          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-all ${
            item.mode === 'weight' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <Weight size={12} /> Weight
        </button>
        <button
          onClick={() => onUpdate({ mode: 'price', quantity: 0, weight: 0, total: item.total || 0 })}
          className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded transition-all ${
            item.mode === 'price' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          <IndianRupee size={12} /> Price
        </button>
      </div>

      {/* Input */}
      {item.mode === 'quantity' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => item.quantity > 1 && onUpdate({ quantity: item.quantity - 1 })}
            className="w-8 h-8 rounded-md bg-background flex items-center justify-center text-foreground hover:bg-accent"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold text-foreground w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdate({ quantity: item.quantity + 1 })}
            className="w-8 h-8 rounded-md bg-background flex items-center justify-center text-foreground hover:bg-accent"
          >
            <Plus size={14} />
          </button>
          <span className="ml-auto text-sm font-bold text-foreground">₹{item.total.toFixed(2)}</span>
        </div>
      ) : item.mode === 'weight' ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={item.weight || ''}
            readOnly
            onClick={() => openKeypad('weight')}
            onFocus={() => openKeypad('weight')}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="flex-1 px-3 py-1.5 rounded-md border border-input text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">{item.product.unit}</span>
          <span className="text-sm font-bold text-foreground">₹{item.total.toFixed(2)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">₹</span>
          <input
            type="number"
            value={item.total || ''}
            readOnly
            onClick={() => openKeypad('price')}
            onFocus={() => openKeypad('price')}
            placeholder="Enter price"
            step="1"
            min="0"
            className="flex-1 px-3 py-1.5 rounded-md border border-input text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      )}

      <NumericKeypadModal
        open={keypadOpen}
        title={keypadField === 'weight' ? 'Enter weight' : 'Enter price'}
        value={keypadValue}
        onChange={setKeypadValue}
        onClose={() => setKeypadOpen(false)}
        onConfirm={confirmKeypad}
      />
    </div>
  );
}
