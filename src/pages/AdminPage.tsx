import { useCallback, useEffect, useState } from 'react';
import SiteLayout from '@/components/SiteLayout';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { formatMoney } from '@/hooks/use-balance';
import { useAuth } from '@/hooks/use-auth';
import func2url from '../../backend/func2url.json';

interface PendingRequest {
  id: number;
  order_code: string;
  amount: number;
  total: number;
  receipt_url: string;
  created_at: string;
  email: string;
  nickname: string;
}

interface PendingWithdrawal {
  id: number;
  order_code: string;
  amount: number;
  trade_url: string;
  created_at: string;
  email: string;
  nickname: string;
}

const token = () => {
  try {
    return localStorage.getItem('nicedrop_token') || '';
  } catch {
    return '';
  }
};

const AdminPage = () => {
  const { user, loading } = useAuth();
  const [list, setList] = useState<PendingRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${func2url.topup}?action=pending`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
        body: '{}',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Нет доступа');
        return;
      }
      setError('');
      setList(data.requests || []);
      setWithdrawals(data.withdrawals || []);
    } catch {
      setError('Сервис временно недоступен');
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const reviewWithdraw = async (id: number, decision: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      const res = await fetch(`${func2url.topup}?action=review_withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось обработать заявку' });
        return;
      }
      toast({
        title: decision === 'approved' ? 'Вывод отправлен' : 'Вывод отклонён',
        description:
          decision === 'approved'
            ? 'Отправьте предмет обменом по трейд-ссылке.'
            : 'Средства возвращены игроку на баланс.',
      });
      await load();
    } finally {
      setBusy(0);
    }
  };

  const review = async (id: number, decision: 'approved' | 'rejected') => {
    setBusy(id);
    try {
      const res = await fetch(`${func2url.topup}?action=review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token() },
        body: JSON.stringify({ id, decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось обработать заявку' });
        return;
      }
      toast({
        title: decision === 'approved' ? 'Пополнение подтверждено' : 'Заявка отклонена',
        description: decision === 'approved' ? 'Баланс игрока пополнен.' : 'Средства не зачислены.',
      });
      await load();
    } finally {
      setBusy(0);
    }
  };

  if (loading) return null;

  return (
    <SiteLayout>
      <section>
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          Заявки <span className="text-primary">игроков</span>
        </h2>
        <p className="mt-2 text-[.85em] font-bold text-muted-foreground">
          Сверьте выписку с поступлением на карту и подтвердите зачисление или вывод.
        </p>

        {!user && (
          <p className="mt-6 text-[.9em] font-bold text-muted-foreground">
            Войдите в аккаунт администратора.
          </p>
        )}

        {error && (
          <p className="mt-6 flex items-center gap-2 text-[.9em] font-bold text-hot">
            <Icon name="TriangleAlert" size={16} />
            {error}
          </p>
        )}

        {user && !error && list.length === 0 && withdrawals.length === 0 && (
          <p className="mt-6 text-[.9em] font-bold text-muted-foreground">
            Новых заявок нет.
          </p>
        )}

        {withdrawals.length > 0 && (
          <>
            <h3 className="mt-6 font-display text-[1.15em] uppercase tracking-[.02em]">
              Вывод в Steam
            </h3>
            <div className="mt-3 grid gap-3.5 md:grid-cols-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="rounded-[var(--hero-radius)] border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-[1.2em] uppercase tracking-[.02em]">
                        №{w.order_code} · {formatMoney(w.amount)}
                      </div>
                      <div className="text-[.76em] font-bold text-muted-foreground">
                        {w.nickname} · {w.email}
                      </div>
                      <div className="text-[.72em] font-bold text-muted-foreground">
                        {new Date(w.created_at).toLocaleString('ru-RU')}
                      </div>
                    </div>
                  </div>

                  <a
                    href={w.trade_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[.8em] font-extrabold text-foreground transition-colors hover:border-primary/40"
                  >
                    <Icon name="Link" size={16} className="text-primary" />
                    Открыть трейд-ссылку
                    <Icon name="ExternalLink" size={14} className="ml-auto text-muted-foreground" />
                  </a>

                  <div className="mt-3 flex gap-2.5">
                    <button
                      onClick={() => reviewWithdraw(w.id, 'rejected')}
                      disabled={busy === w.id}
                      className="flex-1 rounded-full border border-border bg-secondary py-2.5 text-[.82em] font-extrabold text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50"
                    >
                      Отклонить
                    </button>
                    <button
                      onClick={() => reviewWithdraw(w.id, 'approved')}
                      disabled={busy === w.id}
                      className="flex-1 rounded-full bg-primary py-2.5 font-display text-[.95em] tracking-[.03em] text-primary-foreground disabled:opacity-50"
                    >
                      Отправлено
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {list.length > 0 && (
          <h3 className="mt-6 font-display text-[1.15em] uppercase tracking-[.02em]">
            Пополнение баланса
          </h3>
        )}

        <div className="mt-3 grid gap-3.5 md:grid-cols-2">
          {list.map((r) => (
            <div
              key={r.id}
              className="rounded-[var(--hero-radius)] border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-[1.2em] uppercase tracking-[.02em]">
                    №{r.order_code} · {formatMoney(r.amount)}
                  </div>
                  <div className="text-[.76em] font-bold text-muted-foreground">
                    {r.nickname} · {r.email}
                  </div>
                  <div className="text-[.72em] font-bold text-muted-foreground">
                    {new Date(r.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="text-right text-[.78em] font-extrabold text-primary">
                  к зачислению
                  <div className="text-[1.1em]">{formatMoney(r.total)}</div>
                </div>
              </div>

              <a
                href={r.receipt_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-[.8em] font-extrabold text-foreground transition-colors hover:border-primary/40"
              >
                <Icon name="FileText" size={16} className="text-primary" />
                Открыть выписку
                <Icon name="ExternalLink" size={14} className="ml-auto text-muted-foreground" />
              </a>

              <div className="mt-3 flex gap-2.5">
                <button
                  onClick={() => review(r.id, 'rejected')}
                  disabled={busy === r.id}
                  className="flex-1 rounded-full border border-border bg-secondary py-2.5 text-[.82em] font-extrabold text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50"
                >
                  Отклонить
                </button>
                <button
                  onClick={() => review(r.id, 'approved')}
                  disabled={busy === r.id}
                  className="flex-1 rounded-full bg-primary py-2.5 font-display text-[.95em] tracking-[.03em] text-primary-foreground disabled:opacity-50"
                >
                  Зачислить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
};

export default AdminPage;