import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { topPlayers } from '@/data/nicedrop';
import { formatMoney } from '@/hooks/use-balance';

const periods = [
  { id: 'day', label: 'За день' },
  { id: 'week', label: 'За неделю' },
  { id: 'all', label: 'За всё время' },
];

const factor: Record<string, number> = { day: 0.12, week: 0.44, all: 1 };

const medal = (place: number) => {
  if (place === 1) return 'text-primary border-primary/40 bg-primary/10';
  if (place === 2) return 'text-foreground border-border bg-secondary';
  if (place === 3) return 'text-hot border-hot/40 bg-hot/10';
  return 'text-muted-foreground border-border bg-card';
};

const TopPlayers = () => {
  const [period, setPeriod] = useState('week');
  const k = factor[period];

  return (
    <section id="top" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          Топ <span className="text-primary">игроков</span>
        </h2>
        <p className="pb-1 text-[.85em] font-bold text-muted-foreground">
          Рейтинг по сумме выпавших предметов.
        </p>
        <div className="ml-auto flex gap-2 pb-1">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[.78em] font-extrabold transition-colors ${
                period === p.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--hero-radius)] border border-border bg-card">
        {topPlayers.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors hover:bg-secondary/50 sm:gap-4 sm:px-5"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-display text-[.95em] ${medal(p.place)}`}
            >
              {p.place}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[.92em] font-extrabold">{p.name}</div>
              <div className="truncate text-[.72em] font-bold text-muted-foreground">
                Лучший дроп: {p.best}
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 text-[.78em] font-bold text-muted-foreground sm:flex">
              <Icon name="Package" size={14} />
              {Math.round(p.cases * k)} кейсов
            </div>
            <div className="shrink-0 font-display text-[1em] text-primary">
              {formatMoney(Math.round(p.total * k))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopPlayers;
