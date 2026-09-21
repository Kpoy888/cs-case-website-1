import { CSSProperties, useEffect, useState } from 'react';
import SiteLayout from '@/components/SiteLayout';
import Icon from '@/components/ui/icon';
import AuthDialog from '@/components/AuthDialog';
import { toast } from '@/hooks/use-toast';
import { rarityColor } from '@/data/nicedrop';
import { formatMoney, useBalance } from '@/hooks/use-balance';
import { useAuth } from '@/hooks/use-auth';
import { useInventory } from '@/hooks/use-inventory';
import { useTopUpRequests } from '@/hooks/use-topup';

const MAX_TRADE_ITEMS = 20;

const InventoryPage = () => {
  const { user } = useAuth();
  const { setBalance } = useBalance();
  const { items, totalValue, refresh, sell, withdraw } = useInventory();
  const { tradeUrl } = useTopUpRequests();
  const [picked, setPicked] = useState<number[]>([]);
  const [trade, setTrade] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (tradeUrl) setTrade(tradeUrl);
  }, [tradeUrl]);

  const owned = items.filter((i) => i.status === 'owned');
  const pending = items.filter((i) => i.status === 'withdrawing');
  const pickedItems = owned.filter((i) => picked.includes(i.id));
  const pickedSum = pickedItems.reduce((s, i) => s + i.price, 0);

  const toggle = (id: number) => {
    setError('');
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const doSell = async () => {
    if (!picked.length) return;
    setBusy(true);
    const res = await sell(picked);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof res.balance === 'number') setBalance(res.balance);
    setPicked([]);
    toast({
      title: 'Предметы проданы',
      description: `На баланс зачислено ${formatMoney(res.earned || 0)}.`,
    });
  };

  const doWithdraw = async () => {
    if (!picked.length) return;
    if (picked.length > MAX_TRADE_ITEMS) {
      setError(`За раз можно вывести не больше ${MAX_TRADE_ITEMS} предметов`);
      return;
    }
    if (!trade.startsWith('https://steamcommunity.com/tradeoffer/new/')) {
      setError('Вставьте трейд-ссылку из настроек Steam');
      return;
    }
    setBusy(true);
    const err = await withdraw(picked, trade.trim());
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setPicked([]);
    toast({
      title: 'Заявка на вывод создана',
      description: 'Трейд-предложение придёт в Steam после проверки.',
    });
  };

  return (
    <SiteLayout>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
              Мой <span className="text-primary">инвентарь</span>
            </h2>
            <p className="mt-2 text-[.85em] font-bold text-muted-foreground">
              Выпавшие скины хранятся здесь. Выведите их в Steam или продайте за баллы.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/[.07] px-5 py-3">
            <div className="text-[.7em] font-black uppercase tracking-[.16em] text-muted-foreground">
              Стоимость инвентаря
            </div>
            <div className="font-display text-2xl text-primary">{formatMoney(totalValue)}</div>
          </div>
        </div>

        {!user && (
          <div className="mt-6 rounded-[var(--hero-radius)] border border-border bg-card p-8 text-center">
            <Icon name="Lock" size={26} className="mx-auto text-primary" />
            <p className="mt-3 text-[.9em] font-bold text-muted-foreground">
              Войдите в аккаунт, чтобы увидеть свои предметы.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-4 rounded-full bg-primary px-6 py-3 font-display text-[1em] tracking-[.03em] text-primary-foreground"
            >
              Войти или создать аккаунт
            </button>
          </div>
        )}

        {user && owned.length === 0 && pending.length === 0 && (
          <div className="mt-6 rounded-[var(--hero-radius)] border border-dashed border-border p-10 text-center">
            <Icon name="PackageOpen" size={28} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-[.9em] font-bold text-muted-foreground">
              Инвентарь пуст — откройте первый кейс.
            </p>
          </div>
        )}

        {user && owned.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {owned.map((i) => {
                const on = picked.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => toggle(i.id)}
                    style={{ '--sc': rarityColor(i.rarity || '') } as CSSProperties}
                    className={`flex flex-col items-center rounded-[var(--hero-radius)] border p-3 text-center transition-colors ${
                      on
                        ? 'border-primary bg-primary/[.08]'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="relative flex h-[88px] w-full items-center justify-center rounded-xl border border-[hsl(var(--sc))]/35 bg-[hsl(var(--sc))]/[.09]">
                      <img
                        src={i.image_url || ''}
                        alt={i.skin_name}
                        loading="lazy"
                        className="max-h-[70px] w-full object-contain px-1"
                      />
                      {on && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Icon name="Check" size={13} />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 w-full truncate text-[.78em] font-extrabold">
                      {i.skin_name.replace(' · ', ' ')}
                    </div>
                    <div className="text-[.8em] font-extrabold text-primary">
                      {formatMoney(i.price)}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-[var(--hero-radius)] border border-border bg-card p-5">
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
                  className="w-full bg-transparent text-[.86em] font-bold outline-none placeholder:text-muted-foreground"
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

              {error && (
                <p className="mt-3 flex items-center gap-1.5 text-[.78em] font-bold text-hot">
                  <Icon name="TriangleAlert" size={14} />
                  {error}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="text-[.85em] font-extrabold">
                  Выбрано {picked.length} · {formatMoney(pickedSum)}
                </div>
                <button
                  onClick={() => setPicked(owned.map((i) => i.id))}
                  className="text-[.78em] font-extrabold text-primary"
                >
                  Выбрать всё
                </button>
                {picked.length > 0 && (
                  <button
                    onClick={() => setPicked([])}
                    className="text-[.78em] font-extrabold text-muted-foreground"
                  >
                    Сбросить
                  </button>
                )}

                <div className="ml-auto flex gap-2.5">
                  <button
                    onClick={doSell}
                    disabled={busy || !picked.length}
                    className="rounded-full border border-border bg-secondary px-5 py-2.5 text-[.82em] font-extrabold text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40"
                  >
                    Продать за {formatMoney(pickedSum)}
                  </button>
                  <button
                    onClick={doWithdraw}
                    disabled={busy || !picked.length}
                    className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-display text-[.98em] tracking-[.03em] text-primary-foreground disabled:opacity-40"
                  >
                    {busy && <Icon name="LoaderCircle" size={15} className="animate-spin" />}
                    Вывести в Steam
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {user && pending.length > 0 && (
          <div className="mt-4 rounded-[var(--hero-radius)] border border-border bg-card p-5">
            <div className="mb-3 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
              Ожидают отправки в Steam
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {pending.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col items-center rounded-[var(--hero-radius)] border border-border bg-background p-3 text-center opacity-70"
                >
                  <img
                    src={i.image_url || ''}
                    alt={i.skin_name}
                    loading="lazy"
                    className="h-[70px] w-full object-contain"
                  />
                  <div className="mt-2 w-full truncate text-[.76em] font-extrabold">
                    {i.skin_name.replace(' · ', ' ')}
                  </div>
                  <div className="flex items-center gap-1.5 text-[.72em] font-bold text-primary">
                    <Icon name="Clock" size={12} />
                    В обработке
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AuthDialog open={authOpen} initialMode="register" onClose={() => setAuthOpen(false)} />
      </section>
    </SiteLayout>
  );
};

export default InventoryPage;
