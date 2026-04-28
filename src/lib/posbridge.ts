import type { CartItem, Order } from '@/lib/store';

const TIMEOUT_MS = 2000;
const ENV_BRIDGE_URL = (import.meta.env.VITE_POS_BRIDGE_URL as string | undefined)?.trim();
const DEFAULT_BRIDGE_URLS = ['https://localhost:3000', 'http://localhost:3000'];

let preferredBridgeUrl: string | null = null;

interface BridgeResponse {
  ok: boolean;
  error?: string;
  [key: string]: unknown;
}

interface BridgeItem {
  name: string;
  qty: number;
  price: number;
}

interface BridgePrintPayload {
  invoiceNo: string;
  cashier: string;
  items: BridgeItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  openDrawer: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function bridgeCandidates(): string[] {
  if (ENV_BRIDGE_URL) {
    return [ENV_BRIDGE_URL];
  }

  if (preferredBridgeUrl) {
    return [preferredBridgeUrl];
  }

  return DEFAULT_BRIDGE_URLS;
}

function normalizeBridgeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'POS Bridge request timed out';
  }

  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'POS Bridge not reachable. Start the POS Bridge desktop app on this machine.';
  }

  return message;
}

async function readJsonSafe(response: Response): Promise<BridgeResponse> {
  try {
    return (await response.json()) as BridgeResponse;
  } catch {
    return { ok: false, error: `Bridge returned HTTP ${response.status}` };
  }
}

async function bridgeFetch(path: string, options: RequestInit = {}): Promise<BridgeResponse> {
  const candidates = bridgeCandidates();
  let lastError = 'POS Bridge not reachable. Start the POS Bridge desktop app on this machine.';

  for (const baseUrl of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        mode: 'cors',
        signal: controller.signal,
        headers: {
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      const data = await readJsonSafe(response);
      if (data.ok) {
        preferredBridgeUrl = baseUrl;
      }

      return data;
    } catch (error) {
      clearTimeout(timer);
      lastError = normalizeBridgeError(error);
    }
  }

  return { ok: false, error: lastError };
}

function getItemQty(item: CartItem): number {
  if (item.mode === 'quantity') return item.quantity;
  if (item.mode === 'weight') return item.weight;
  return 1;
}

function toBridgeItem(item: CartItem): BridgeItem {
  const qty = getItemQty(item);
  const price = qty > 0 ? round2(item.total / qty) : round2(item.total);
  return {
    name: item.product.name,
    qty: round2(qty),
    price,
  };
}

export function buildPrintPayload(order: Order): BridgePrintPayload {
  const paymentMethods = Array.from(new Set(order.payments.map((p) => p.method.toUpperCase())));

  return {
    invoiceNo: order.id,
    cashier: 'Counter',
    items: order.items.map(toBridgeItem),
    subtotal: round2(order.subtotal),
    total: round2(order.subtotal),
    paymentMethod: paymentMethods.join('+') || 'UNKNOWN',
    amountPaid: round2(order.totalPaid),
    change: round2(order.change),
    openDrawer: order.payments.some((p) => p.method === 'cash'),
  };
}

export function getBridgeStatus(): Promise<BridgeResponse> {
  return bridgeFetch('/status');
}

export function printReceipt(payload: BridgePrintPayload): Promise<BridgeResponse> {
  return bridgeFetch('/print', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function openCashDrawer(): Promise<BridgeResponse> {
  return bridgeFetch('/cashdrawer', {
    method: 'POST',
  });
}

// Auto-probe on startup to lock in the preferred bridge URL quickly
setTimeout(() => {
  getBridgeStatus().catch(() => {});
}, 100);
