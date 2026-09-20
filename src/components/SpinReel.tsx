import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { skinArt } from '@/data/skins';
import { rarityColor } from '@/data/nicedrop';

const ITEM_W = 132;
const VISIBLE = 5;

interface Props {
  pool: string[];
  prize: string;
  spinning: boolean;
  onDone: () => void;
}

const SpinReel = ({ pool, prize, spinning, onDone }: Props) => {
  const [offset, setOffset] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const allNames = useMemo(() => Object.keys(skinArt), []);

  const strip = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 46; i++) {
      const src = i % 3 === 0 && pool.length ? pool : allNames;
      list.push(src[Math.floor(Math.random() * src.length)]);
    }
    list[40] = prize;
    return list;
  }, [pool, prize, allNames]);

  useEffect(() => {
    if (!spinning) return;
    setOffset(0);
    const raf = requestAnimationFrame(() => {
      const center = Math.floor(VISIBLE / 2);
      const jitter = (Math.random() - 0.5) * (ITEM_W * 0.5);
      setOffset(-(40 - center) * ITEM_W + jitter);
    });
    const t = setTimeout(() => doneRef.current(), 5200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [spinning, strip]);

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl border border-border bg-background/70"
      style={{ width: ITEM_W * VISIBLE, maxWidth: '100%' }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-[3px] -translate-x-1/2 rounded-full bg-primary shadow-[0_0_16px_4px_hsl(var(--primary)/.55)]" />

      <div
        className="flex py-4"
        style={{
          transform: `translateX(${offset}px)`,
          transition: spinning ? 'transform 5s cubic-bezier(.08,.72,.12,1)' : 'none',
        }}
      >
        {strip.map((name, i) => {
          const skin = skinArt[name];
          return (
            <div
              key={`${name}-${i}`}
              style={{ '--sc': rarityColor(skin?.rarity), width: ITEM_W } as CSSProperties}
              className="relative flex shrink-0 flex-col items-center justify-center px-2"
            >
              <div className="relative flex h-[86px] w-full items-center justify-center rounded-xl border border-[hsl(var(--sc))]/35 bg-[hsl(var(--sc))]/[.09]">
                <div
                  className="absolute inset-x-3 bottom-0 h-[3px] rounded-full"
                  style={{ background: 'hsl(var(--sc))' }}
                />
                <img
                  src={skin?.img}
                  alt={name}
                  loading="lazy"
                  className="max-h-[68px] w-full object-contain px-1"
                />
              </div>
              <div className="mt-1.5 w-full truncate text-center text-[10px] font-bold text-muted-foreground">
                {name.replace(' · ', ' ')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SpinReel;
