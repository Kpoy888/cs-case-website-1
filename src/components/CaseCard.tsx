import { CSSProperties } from 'react';
import CrateIcon from '@/components/CrateIcon';
import { CaseItem, rarityVar } from '@/data/nicedrop';
import { formatMoney } from '@/hooks/use-balance';

interface Props {
  item: CaseItem;
  index: number;
  onOpen: (item: CaseItem) => void;
}

const CaseCard = ({ item, index, onOpen }: Props) => (
  <article
    style={
      {
        '--c': rarityVar[item.rarity],
        animationDelay: `${0.02 + index * 0.05}s`,
      } as CSSProperties
    }
    className="case-card group relative flex animate-rise flex-col overflow-hidden rounded-[var(--hero-radius)] border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
  >
    <div className="flex items-center justify-between">
      <span className="text-[.68em] font-black uppercase tracking-[.14em] text-[hsl(var(--c))]">
        {item.rarityLabel}
      </span>
      <span className="text-[.7em] font-extrabold text-muted-foreground">{item.odds}</span>
    </div>

    <div className="flex flex-1 items-center justify-center py-3">
      <CrateIcon className="w-[116px] drop-shadow-[0_12px_18px_rgba(0,0,0,.6)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105" />
    </div>

    <div className="mb-2 font-display text-[1.12em] uppercase leading-none tracking-[.02em]">
      {item.name}
    </div>

    <div className="flex items-center justify-between border-t border-border pt-2.5">
      <span className="font-display text-[1.1em] tracking-[.02em] text-primary">
        {formatMoney(item.price)}
      </span>
      <button
        onClick={() => onOpen(item)}
        className={`rounded-full px-3.5 py-1.5 text-[.78em] font-black uppercase tracking-[.06em] transition-colors ${
          item.lead
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/[.14] text-primary hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        Открыть
      </button>
    </div>
  </article>
);

export default CaseCard;
