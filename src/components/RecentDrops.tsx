import { CSSProperties, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { liveDrops, rarityVar } from '@/data/nicedrop';
import { formatMoney } from '@/hooks/use-balance';

const RecentDrops = () => {
  const [items, setItems] = useState(liveDrops);

  useEffect(() => {
    const t = setInterval(() => {
      setItems((list) => {
        const next = [...list];
        next.unshift(next.pop()!);
        return next;
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="drops" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          Последние <span className="text-primary">дропы</span>
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-live/[.14] px-3 py-1 text-[.7em] font-black uppercase tracking-[.16em] text-live">
          <i className="block h-[6px] w-[6px] animate-pulse-dot rounded-full bg-live" />
          в реальном времени
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.slice(0, 8).map((d) => (
          <div
            key={d.user + d.item}
            style={{ '--c': rarityVar[d.rarity] } as CSSProperties}
            className="drop-card relative flex animate-fade-in items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3.5"
          >
            <i className="drop-skin block h-11 w-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="text-[.72em] font-bold text-muted-foreground">{d.user}</div>
              <div className="truncate text-[.85em] font-extrabold">{d.item}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-display text-[.95em] text-primary">{formatMoney(d.price)}</div>
              <div className="flex items-center justify-end gap-1 text-[.65em] font-bold text-muted-foreground">
                <Icon name="Clock" size={11} />
                сейчас
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentDrops;
