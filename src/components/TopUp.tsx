import { useState } from 'react';
import Icon from '@/components/ui/icon';
import CardPaymentDialog from '@/components/CardPaymentDialog';
import { toast } from '@/hooks/use-toast';
import { topUpMethods } from '@/data/nicedrop';
import { formatMoney, useBalance } from '@/hooks/use-balance';
import { useAuth } from '@/hooks/use-auth';
import AuthDialog from '@/components/AuthDialog';

const presets = [100, 500, 1000, 5000, 10000, 25000];

const TopUp = () => {
  const { balance, topUp } = useBalance();
  const [method, setMethod] = useState('card');
  const [amount, setAmount] = useState('5000');
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  const num = Number(amount.replace(/\s/g, ''));
  const bonus = num >= 2000 ? 0.25 : num >= 300 ? 0.15 : 0;
  const total = Math.round(num * (1 + bonus));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!num || Number.isNaN(num)) {
      setError('Введите сумму пополнения');
      return;
    }
    if (num < 100) {
      setError('Минимальная сумма пополнения — 100 ₽');
      return;
    }
    if (num > 100000) {
      setError('Максимум за одну операцию — 100 000 ₽');
      return;
    }
    setError('');

    if (method === 'card') {
      setPayOpen(true);
      return;
    }

    credit();
  };

  const credit = () => {
    topUp(total);
    toast({
      title: 'Баланс пополнен',
      description: `Зачислено ${formatMoney(total)}${bonus ? ` с бонусом +${bonus * 100}%` : ''}.`,
    });
  };

  return (
    <section id="topup" className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          Пополнение <span className="text-primary">баланса</span>
        </h2>
        <p className="mt-2 text-[.85em] font-bold text-muted-foreground">
          Зачисление моментальное. Бонус +15% от 300 ₽ и +25% от 2 000 ₽.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <form
          onSubmit={submit}
          className="rounded-[var(--hero-radius)] border border-border bg-card p-5 sm:p-6"
        >
          <div className="mb-2 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
            Способ оплаты
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {topUpMethods.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                  method === m.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:border-primary/40'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    method === m.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <Icon name={m.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[.88em] font-extrabold">{m.label}</span>
                  <span className="block truncate text-[.72em] font-bold text-muted-foreground">
                    {m.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mb-2 mt-6 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
            Сумма
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => {
                  setAmount(String(p));
                  setError('');
                }}
                className={`rounded-full border px-4 py-2 text-[.8em] font-extrabold transition-colors ${
                  num === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {p} ₽
              </button>
            ))}
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
              aria-label="Сумма пополнения"
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
            className="mt-5 w-full rounded-full bg-primary py-3.5 font-display text-lg tracking-[.03em] text-primary-foreground shadow-[0_8px_26px_hsl(var(--primary)/0.28)] transition-transform hover:scale-[1.01]"
          >
            {!user
              ? 'Войти и пополнить'
              : method === 'card'
                ? 'Получить реквизиты'
                : `Пополнить на ${formatMoney(total || 0)}`}
          </button>
        </form>

        <aside className="flex flex-col gap-4">
          <div className="promo-card rounded-[var(--hero-radius)] border border-primary/30 p-5">
            <div className="text-[.72em] font-black uppercase tracking-[.2em] text-muted-foreground">
              Ваш баланс
            </div>
            <div className="mt-1 font-display text-4xl text-primary">{formatMoney(balance)}</div>
            <div className="mt-4 space-y-2 text-[.8em] font-bold text-muted-foreground">
              <div className="flex justify-between">
                <span>К зачислению</span>
                <span className="text-foreground">{formatMoney(num || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Бонус</span>
                <span className="text-primary">+{Math.round(bonus * 100)}%</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span>Итого</span>
                <span className="text-foreground">{formatMoney(total || 0)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--hero-radius)] border border-border bg-card p-5">
            {[
              { icon: 'ShieldCheck', t: 'Защита платежей', d: 'Оплата через проверенных провайдеров' },
              { icon: 'Zap', t: 'Моментально', d: 'Баланс обновляется за секунды' },
              { icon: 'Headphones', t: 'Поддержка 24/7', d: 'Отвечаем в чате и Telegram' },
            ].map((f) => (
              <div key={f.t} className="flex gap-3 border-b border-border py-3 last:border-0 last:pb-0 first:pt-0">
                <Icon name={f.icon} size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <div className="text-[.85em] font-extrabold">{f.t}</div>
                  <div className="text-[.75em] font-bold text-muted-foreground">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <CardPaymentDialog
        open={payOpen}
        amount={num || 0}
        total={total || 0}
        onClose={() => setPayOpen(false)}
        onPaid={() => {
          setPayOpen(false);
          credit();
        }}
      />

      <AuthDialog open={authOpen} initialMode="register" onClose={() => setAuthOpen(false)} />
    </section>
  );
};

export default TopUp;