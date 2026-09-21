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

const token = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const useTopUpRequests = (onBalance?: (value: number) => void) => {
  const [requests, setRequests] = useState<TopUpRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const seen = useRef(new Map<number, string>());

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

  return { requests, loading, refresh, create };
};

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });