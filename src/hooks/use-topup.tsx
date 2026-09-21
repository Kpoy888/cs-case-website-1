import { useCallback, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import func2url from '../../backend/func2url.json';

const TOPUP_URL = func2url.topup;
const TOKEN_KEY = 'nicedrop_token';

export interface TopUpRequest {
  id: number;
  order_code: string;
  amount: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface WithdrawRequest {
  id: number;
  order_code: string;
  amount: number;
  item_name?: string | null;
  trade_url: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

const token = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const useTopUpRequests = (onBalance?: (value: number) => void) => {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [tradeUrl, setTradeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const seen = useRef(new Map<number, string>());
  const seenW = useRef(new Map<number, string>());

  const refresh = useCallback(async () => {
    if (!token()) return;
    setLoading(true);
    try {
      const res = await fetch(TOPUP_URL, { headers: { 'X-Auth-Token': token() } });
      const data = await res.json();
      if (res.ok) {
        const list: TopUpRequest[] = data.requests || [];

        list.forEach((r) => {
          const was = seen.current.get(r.id);
          if (was === 'pending' && r.status === 'approved') {
            toast({
              title: 'Баланс пополнен',
              description: `Заявка №${r.order_code} подтверждена: +${r.total.toLocaleString('ru-RU')} ₽.`,
            });
          }
          if (was === 'pending' && r.status === 'rejected') {
            toast({
              title: 'Заявка отклонена',
              description: r.comment || 'Перевод не найден. Проверьте выписку и сумму.',
            });
          }
          seen.current.set(r.id, r.status);
        });

        setRequests(list);

        const wlist: WithdrawRequest[] = data.withdrawals || [];
        wlist.forEach((w) => {
          const was = seenW.current.get(w.id);
          if (was === 'pending' && w.status === 'approved') {
            toast({
              title: 'Вывод отправлен',
              description: `Заявка №${w.order_code}: трейд-предложение придёт в Steam.`,
            });
          }
          if (was === 'pending' && w.status === 'rejected') {
            toast({
              title: 'Вывод отклонён',
              description: w.comment || 'Средства возвращены на баланс.',
            });
          }
          seenW.current.set(w.id, w.status);
        });
        setWithdrawals(wlist);

        if (typeof data.trade_url === 'string') setTradeUrl(data.trade_url);
        if (onBalance && typeof data.balance === 'number') onBalance(data.balance);
      }
    } catch {
      /* сеть недоступна — показываем то, что уже загружено */
    } finally {
      setLoading(false);
    }
  }, [onBalance]);

  const create = useCallback(
    async (amount: number, receipt: string): Promise<string> => {
      try {
        const res = await fetch(`${TOPUP_URL}?action=create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
          body: JSON.stringify({ amount, receipt, method: 'card' }),
        });
        const data = await res.json();
        if (!res.ok) return data.error || 'Не удалось отправить заявку';
        await refresh();
        return '';
      } catch {
        return 'Сервис временно недоступен, попробуйте позже';
      }
    },
    [refresh],
  );

  const withdraw = useCallback(
    async (amount: number, trade_url: string): Promise<string> => {
      try {
        const res = await fetch(`${TOPUP_URL}?action=withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
          body: JSON.stringify({ amount, trade_url }),
        });
        const data = await res.json();
        if (!res.ok) return data.error || 'Не удалось отправить заявку на вывод';
        await refresh();
        return '';
      } catch {
        return 'Сервис временно недоступен, попробуйте позже';
      }
    },
    [refresh],
  );

  return { requests, withdrawals, tradeUrl, loading, refresh, create, withdraw };
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });