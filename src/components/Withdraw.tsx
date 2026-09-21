import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import AuthDialog from '@/components/AuthDialog';
import { toast } from '@/hooks/use-toast';
import { formatMoney, useBalance } from '@/hooks/use-balance';
import { useAuth } from '@/hooks/use-auth';
import { WithdrawRequest } from '@/hooks/use-topup';

const MIN_WITHDRAW = 500;

const statusInfo: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'В обработке', icon: 'Clock', color: 'text-primary' },
  approved: { label: 'Отправлено', icon: 'CircleCheck', color: 'text-live' },
  rejected: { label: 'Отклонено', icon: 'CircleX', color: 'text-hot' },
};

interface Props {
  withdrawals: WithdrawRequest[];
  savedTradeUrl: string;
  onWithdraw: (amount: number, tradeUrl: string) => Promise<string>;
  onRefresh: () => void;
}

const Withdraw = ({ withdrawals, savedTradeUrl, onWithdraw, onRefresh }: Props) => {
  const { balance } = useBalance();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [trade, setTrade] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (savedTradeUrl) setTrade(savedTradeUrl);
  }, [savedTradeUrl]);

  const num = Number(amount.replace(/\s/g, ''));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!num || num < MIN_WITHDRAW) {
      setError(`Минимальная сумма вывода — ${MIN_WITHDRAW} ₽`);
      return;
    }
    if (num > balance) {
      setError('На балансе недостаточно средств');
      return;
    }
    if (!trade.startsWith('https://steamcommunity.com/tradeoffer/new/')) {
      setError('Вставьте трейд-ссылку из настроек Steam');
      return;
    }

    setBusy(true);
    const err = await onWithdraw(num, trade.trim());
    setBusy(false);

    if (err) {
      setError(err);
      return;
    }

    setError('');
    setAmount('');
    toast({
      title: 'Заявка на вывод создана',
      description: 'Трейд-предложение придёт в Steam после проверки.',
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <form
        onSubmit={submit}
        className="rounded-[var(--hero-radius)] border border-border bg-card p-5 sm:p-6"
      >
        <div className="mb-2 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
          Трейд-ссылка Steam
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
          <Icon name="Link" size={18} className="shrink-0 text-muted-foreground" />
          <input
            value={trade}
            onChange={(e) => {
              setTrade(e.target.value);
              setError('');
            }}
            placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
            className="w-full bg-transparent text-[.88em] font-bold outline-none placeholder:font-bold placeholder:text-muted-foreground"
            aria-label="Трейд-ссылка Steam"
          />
        </div>
        <a
          href="https://steamcommunity.com/my/tradeoffers/privacy"
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-[.75em] font-extrabold text-primary"
        >
          Где взять трейд-ссылку
          <Icon name="ExternalLink" size={13} />
        </a>

        <div className="mb-2 mt-6 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
          Сумма вывода
        </div>
        <div className="flex flex-wrap gap-2">
          {[500, 1000, 2500, 5000].map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => {
                setAmount(String(p));
                setError('');
              }}
              disabled={p > balance}
              className={`rounded-full border px-4 py-2 text-[.8em] font-extrabold transition-colors disabled:opacity-35 ${
                num === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p} ₽
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setAmount(String(balance));
              setError('');
            }}
            disabled={balance < MIN_WITHDRAW}
            className="rounded-full border border-border px-4 py-2 text-[.8em] font-extrabold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
          >
            Весь баланс
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
          <Icon name="Wallet" size={18} className="text-muted-foreground" />
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/[^\d]/g, ''));
              setError('');
            }}
            inputMode="numeric"
            placeholder="Своя сумма"
            className="w-full bg-transparent text-[1em] font-extrabold outline-none placeholder:font-bold placeholder:text-muted-foreground"
            aria-label="Сумма вывода"
          />
          <span className="font-display text-[1em] text-muted-foreground">₽</span>
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-[.78em] font-bold text-hot">
            <Icon name="TriangleAlert" size={14} />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-display text-lg tracking-[.03em] text-primary-foreground shadow-[0_8px_26px_hsl(var(--primary)/0.28)] transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {busy && <Icon name="LoaderCircle" size={16} className="animate-spin" />}
          {user ? 'Вывести в Steam' : 'Войти и вывести'}
        </button>
      </form>

      <aside className="flex flex-col gap-4">
        <div className="promo-card rounded-[var(--hero-radius)] border border-primary/30 p-5">
          <div className="text-[.72em] font-black uppercase tracking-[.2em] text-muted-foreground">
            Доступно к выводу
          </div>
          <div className="mt-1 font-display text-4xl text-primary">{formatMoney(balance)}</div>
          <div className="mt-4 space-y-2 text-[.8em] font-bold text-muted-foreground">
            <div className="flex justify-between">
              <span>Минимум</span>
              <span className="text-foreground">{formatMoney(MIN_WITHDRAW)}</span>
            </div>
            <div className="flex justify-between">
              <span>Комиссия</span>
              <span className="text-primary">0%</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span>К выводу</span>
              <span className="text-foreground">{formatMoney(num || 0)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--hero-radius)] border border-border bg-card p-5">
          {[
            { icon: 'Link', t: 'Трейд-ссылка', d: 'Профиль Steam должен быть открыт' },
            { icon: 'Clock', t: 'Обмен за 15 минут', d: 'Предложение придёт от нашего бота' },
            { icon: 'ShieldCheck', t: 'Без комиссии', d: 'Выводим всю сумму заявки' },
          ].map((f) => (
            <div
              key={f.t}
              className="flex gap-3 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0"
            >
              <Icon name={f.icon} size={18} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <div className="text-[.85em] font-extrabold">{f.t}</div>
                <div className="text-[.75em] font-bold text-muted-foreground">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {withdrawals.length > 0 && (
        <div className="rounded-[var(--hero-radius)] border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
              Мои выводы
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 text-[.78em] font-extrabold text-primary"
            >
              <Icon name="RefreshCw" size={14} />
              Обновить
            </button>
          </div>

          <div className="space-y-2">
            {withdrawals.map((w) => {
              const s = statusInfo[w.status] ?? statusInfo.pending;
              return (
                <div
                  key={w.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <Icon name={s.icon} size={17} className={`shrink-0 ${s.color}`} />
                  <div className="min-w-0">
                    <div className="text-[.85em] font-extrabold">
                      Заявка №{w.order_code} · {formatMoney(w.amount)}
                    </div>
                    <div className="text-[.72em] font-bold text-muted-foreground">
                      {new Date(w.created_at).toLocaleString('ru-RU')}
                      {w.comment ? ` · ${w.comment}` : ''}
                    </div>
                  </div>
                  <div className={`ml-auto text-[.8em] font-extrabold ${s.color}`}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AuthDialog open={authOpen} initialMode="register" onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Withdraw;
