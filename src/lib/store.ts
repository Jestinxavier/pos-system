import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { flowError, flowLog } from "@/lib/debug";

export interface Product {
  id: string;
  name: string;
  pricePerKg: number;
  pricePerUnit: number | null;
  image: string;
  unit: "kg" | "litre";
  createdAt: string;
}

export interface CartItem {
  product: Product;
  mode: "quantity" | "weight" | "price";
  quantity: number; // bottles/units
  weight: number; // kg or litre
  total: number;
}

export interface PaymentMethod {
  method: "cash" | "upi" | "card";
  amount: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  payments: PaymentMethod[];
  totalPaid: number;
  change: number;
  createdAt: string;
}

const PRODUCTS_COLLECTION = "products";
const ORDERS_COLLECTION = "orders";

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Pure Coconut Oil",
    pricePerKg: 210,
    pricePerUnit: 210,
    image: "",
    unit: "litre",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Virgin Coconut Oil",
    pricePerKg: 350,
    pricePerUnit: 350,
    image: "",
    unit: "litre",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Baby Massage Oil",
    pricePerKg: 280,
    pricePerUnit: 180,
    image: "",
    unit: "litre",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Almond Oil",
    pricePerKg: 450,
    pricePerUnit: 300,
    image: "",
    unit: "litre",
    createdAt: new Date().toISOString(),
  },
];

let didSeedProducts = false;

async function seedDefaultProducts() {
  if (didSeedProducts) return;
  didSeedProducts = true;
  flowLog("seedDefaultProducts:start", { count: defaultProducts.length });

  const batch = writeBatch(db);
  defaultProducts.forEach((product) => {
    batch.set(doc(db, PRODUCTS_COLLECTION, product.id), product, { merge: true });
  });
  try {
    await batch.commit();
    flowLog("seedDefaultProducts:success");
  } catch (error) {
    flowError("seedDefaultProducts:error", error);
    throw error;
  }
}

export function subscribeProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    productsRef,
    async (snapshot) => {
      flowLog("products:snapshot", {
        size: snapshot.size,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
      if (snapshot.empty) {
        await seedDefaultProducts();
        return;
      }

      const products = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Product;
        return { ...data, id: docSnap.id };
      });
      callback(products);
    },
    (error) => {
      flowError("products:snapshot:error", error);
      if (onError) onError(error);
    }
  );
}

export async function saveProduct(product: Product): Promise<void> {
  flowLog("saveProduct:start", { id: product.id, name: product.name });
  try {
    await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), product, { merge: true });
    flowLog("saveProduct:success", { id: product.id });
  } catch (error) {
    flowError("saveProduct:error", error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  flowLog("deleteProduct:start", { id });
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    flowLog("deleteProduct:success", { id });
  } catch (error) {
    flowError("deleteProduct:error", error);
    throw error;
  }
}

export function subscribeOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
) {
  const ordersRef = collection(db, ORDERS_COLLECTION);
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      flowLog("orders:snapshot", {
        size: snapshot.size,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
      const orders = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Order;
        return { ...data, id: docSnap.id };
      });
      callback(orders);
    },
    (error) => {
      flowError("orders:snapshot:error", error);
      if (onError) onError(error);
    }
  );
}

export async function saveOrder(order: Order): Promise<void> {
  flowLog("saveOrder:start", { id: order.id, items: order.items.length });
  try {
    await setDoc(doc(db, ORDERS_COLLECTION, order.id), order, { merge: true });
    flowLog("saveOrder:success", { id: order.id });
  } catch (error) {
    flowError("saveOrder:error", error);
    throw error;
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
