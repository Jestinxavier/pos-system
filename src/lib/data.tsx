import React from "react";
import { subscribeOrders, subscribeProducts, type Order, type Product } from "@/lib/store";
import { useAuth } from "@/lib/auth";

type DataContextValue = {
  products: Product[];
  orders: Order[];
  loadingProducts: boolean;
  loadingOrders: boolean;
  productsError: string | null;
  ordersError: string | null;
};

const DataContext = React.createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [productsError, setProductsError] = React.useState<string | null>(null);
  const [ordersError, setOrdersError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoadingProducts(false);
      setProductsError(null);
      return;
    }

    setLoadingProducts(true);
    setProductsError(null);
    const unsubscribe = subscribeProducts(
      (next) => {
        setProducts(next);
        setLoadingProducts(false);
      },
      (error) => {
        setProductsError(error.message);
        setLoadingProducts(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  React.useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      setOrdersError(null);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);
    const unsubscribe = subscribeOrders(
      (next) => {
        setOrders(next);
        setLoadingOrders(false);
      },
      (error) => {
        setOrdersError(error.message);
        setLoadingOrders(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const value = React.useMemo(
    () => ({ products, orders, loadingProducts, loadingOrders, productsError, ordersError }),
    [products, orders, loadingProducts, loadingOrders, productsError, ordersError]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within DataProvider");
  }
  return ctx;
}
