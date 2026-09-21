import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { formatMoney } from '@/hooks/use-balance';
import { useInventory } from '@/hooks/use-inventory';
import { WithdrawRequest } from '@/hooks/use-topup';

const statusInfo: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: 'В обработке', icon: 'Clock', color: 'text-primary' },
  approved: { label: 'Отправлено', icon: 'CircleCheck', color: 'text-live' },
  rejected: { label: 'Отклонено', icon: 'CircleX', color: 'text-hot' },
};

interface Props {
  withdrawals: WithdrawRequest[];
  onRefresh: () => void;
}

const Withdraw = ({ withdrawals, onRefresh }: Props) => {
  const { items, totalValue } = useInventory();
  const owned = items.filter((i) => i.status === 'owned');

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="rounded-[var(--hero-radius)] border border-border bg-card p-5 sm:p-6">
        <div className="font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
          Вывод предметов
        </div>
        <p className="mt-2 text-[.85em] font-bold leading-[1.5] text-muted-foreground">
          Выводим только скины: выберите нужные предметы в инвентаре, вставьте трейд-ссылку Steam
          и отправьте заявку. Ненужные скины можно продать обратно за баллы.
        </p>

        {owned.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {owned.slice(0, 5).map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col items-center rounded-xl border border-border bg-background p-2 text-center"
                >
                  <img
                    src={i.image_url || ''}
                    alt={i.skin_name}
                    loading="lazy"
                    className="h-12 w-full object-contain"
                  />
                  <span className="mt-1 w-full truncate text-[.7em] font-bold text-muted-foreground">
                    {i.skin_name.replace(' · ', ' ')}
                  </span>
                </div>
              ))}
            </div>
            {owned.length > 5 && (
              <div className="mt-2 text-[.78em] font-bold text-muted-foreground">
                и ещё {owned.length - 5} предметов в инвентаре
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-[.85em] font-bold text-muted-foreground">
            В инвентаре пока нет предметов — откройте кейс.
          </div>
        )}

        <Link
          to="/inventory"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-display text-lg tracking-[.03em] text-primary-foreground shadow-[0_8px_26px_hsl(var(--primary)/0.28)] transition-transform hover:scale-[1.01]"
        >
          <Icon name="PackageOpen" size={18} />
          Перейти в инвентарь
        </Link>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="promo-card rounded-[var(--hero-radius)] border border-primary/30 p-5">
          <div className="text-[.72em] font-black uppercase tracking-[.2em] text-muted-foreground">
            Доступно к выводу
          </div>
          <div className="mt-1 font-display text-4xl text-primary">{formatMoney(totalValue)}</div>
          <div className="mt-4 space-y-2 text-[.8em] font-bold text-muted-foreground">
            <div className="flex justify-between">
              <span>Предметов</span>
              <span className="text-foreground">{owned.length}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span>Комиссия</span>
              <span className="text-primary">0%</span>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--hero-radius)] border border-border bg-card p-5">
          {[
            { icon: 'Link', t: 'Трейд-ссылка', d: 'Профиль Steam должен быть открыт' },
            { icon: 'Clock', t: 'Обмен за 15 минут', d: 'Предложение придёт от нашего бота' },
            { icon: 'ShieldCheck', t: 'Без комиссии', d: 'Отправляем предметы целиком' },
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
                      №{w.order_code} · {w.item_name || formatMoney(w.amount)}
                    </div>
                    <div className="text-[.72em] font-bold text-muted-foreground">
                      {new Date(w.created_at).toLocaleString('ru-RU')}
                      {w.comment ? ` · ${w.comment}` : ''}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className={`text-[.8em] font-extrabold ${s.color}`}>{s.label}</div>
                    <div className="text-[.72em] font-bold text-muted-foreground">
                      {formatMoney(w.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
