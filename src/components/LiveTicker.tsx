import { CSSProperties } from 'react';
import { liveDrops, rarityVar } from '@/data/nicedrop';
import { skinArt } from '@/data/skins';

const LiveTicker = () => (
  <div className="mt-3 flex items-stretch gap-2">
    <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-live/[.14] px-3.5 text-[.72em] font-black uppercase tracking-[.16em] text-live">
      <i className="block h-[7px] w-[7px] animate-pulse-dot rounded-full bg-live" />
      Дропы
    </div>

    <div className="relative flex-1 overflow-hidden">
      <div className="flex w-max animate-marquee gap-2">
        {[...liveDrops, ...liveDrops].map((d, i) => (
          <div
            key={`${d.user}-${i}`}
            style={{ '--c': rarityVar[d.rarity] } as CSSProperties}
            className="drop-card relative flex h-[62px] w-[210px] shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border border-border bg-card px-3"
          >
            {skinArt[d.item] ? (
              <img
                src={skinArt[d.item].img}
                alt={d.item}
                loading="lazy"
                className="h-[34px] w-[40px] shrink-0 object-contain"
              />
            ) : (
              <i className="drop-skin block h-[34px] w-[34px] shrink-0 rounded-[9px]" />
            )}
            <div className="min-w-0">
              <div className="text-[.72em] font-bold text-muted-foreground">{d.user}</div>
              <div className="truncate text-[.8em] font-extrabold">{d.item}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  </div>
);

export default LiveTicker;