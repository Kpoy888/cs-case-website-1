import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import func2url from '../../backend/func2url.json';

const INV_URL = func2url.inventory;

export interface InventoryItem {
  id: number;
  skin_name: string;
  price: number;
  image_url?: string | null;
  rarity?: string | null;
  case_name?: string | null;
  status: 'owned' | 'withdrawing' | 'withdrawn';
  created_at: string;
}

interface AddPayload {
  skin_name: string;
  price: number;
  image_url?: string;
  rarity?: string;
  case_name?: string;
  case_price?: number;
}

interface InventoryCtx {
  items: InventoryItem[];
  totalValue: number;
  loading: boolean;
  refresh: () => Promise<void>;
  addItem: (data: AddPayload) => Promise<{ error: string; balance?: number; itemId?: number }>;
  sell: (ids: number[]) => Promise<{ error: string; earned?: number; balance?: number }>;
  withdraw: (ids: number[], tradeUrl: string) => Promise<string>;
}

const Ctx = createContext<InventoryCtx | null>(null);

const token = () => {
  try {
    return localStorage.getItem('nicedrop_token') || '';
  } catch {
    return '';
  }
};

export const InventoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token()) {
      setItems([]);
      setTotalValue(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(INV_URL, { headers: { 'X-Auth-Token': token() } });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setTotalValue(data.total_value || 0);
      }
    } catch {
      /* сеть недоступна */
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (action: string, payload: object) => {
    const res = await fetch(`${INV_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, data: await res.json() };
  }, []);

  const addItem = useCallback(
    async (data: AddPayload) => {
      try {
        const { ok, data: res } = await post('add', data);
        if (!ok) return { error: res.error || 'Не удалось сохранить предмет' };
        await refresh();
        return { error: '', balance: res.balance, itemId: res.item?.id };
      } catch {
        return { error: 'Сервис временно недоступен' };
      }
    },
    [post, refresh],
  );

  const sell = useCallback(
    async (ids: number[]) => {
      try {
        const { ok, data } = await post('sell', { ids });
        if (!ok) return { error: data.error || 'Не удалось продать' };
        await refresh();
        return { error: '', earned: data.earned, balance: data.balance };
      } catch {
        return { error: 'Сервис временно недоступен' };
      }
    },
    [post, refresh],
  );

  const withdraw = useCallback(
    async (ids: number[], trade_url: string) => {
      try {
        const { ok, data } = await post('withdraw', { ids, trade_url });
        if (!ok) return data.error || 'Не удалось создать заявку';
        await refresh();
        return '';
      } catch {
        return 'Сервис временно недоступен';
      }
    },
    [post, refresh],
  );

  const value = useMemo(
    () => ({ items, totalValue, loading, refresh, addItem, sell, withdraw }),
    [items, totalValue, loading, refresh, addItem, sell, withdraw],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useInventory = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};