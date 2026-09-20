import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import CaseCard from '@/components/CaseCard';
import { CaseItem, CategoryId, cases } from '@/data/nicedrop';

type SortId = 'popular' | 'cheap' | 'expensive';

const sorts: { id: SortId; label: string }[] = [
  { id: 'popular', label: 'Популярные' },
  { id: 'cheap', label: 'Сначала дешёвые' },
  { id: 'expensive', label: 'Сначала дорогие' },
];

interface Props {
  category: CategoryId;
  onOpen: (item: CaseItem) => void;
}

const CaseGrid = ({ category, onOpen }: Props) => {
  const [sort, setSort] = useState<SortId>('popular');
  const [expanded, setExpanded] = useState(false);

  const list = useMemo(() => {
    let l = cases.filter((c) => {
      if (category === 'all') return true;
      if (category === 'cheap') return c.category === 'cheap';
      return c.category === category;
    });
    if (sort === 'cheap') l = [...l].sort((a, b) => a.price - b.price);
    if (sort === 'expensive') l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [category, sort]);

  const visible = expanded ? list : list.slice(0, 6);

  return (
    <main className="flex min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-end gap-4">
        <h1 className="font-display text-head uppercase leading-[1.05] tracking-[.01em]">
          Кейсы <span className="not-italic text-primary">Nicedrop</span>
        </h1>
        <div className="pb-1.5 text-[.88em] font-bold text-muted-foreground">
          Выпадение проверяется, вывод в Steam за 2 минуты.
        </div>
        <div className="ml-auto flex gap-2 pb-1">
          {sorts.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[.78em] font-extrabold transition-colors ${
                sort === s.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-[var(--hero-radius)] border border-dashed border-border p-12 text-muted-foreground">
          В этой категории пока пусто
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c, i) => (
            <CaseCard key={c.id} item={c} index={i} onOpen={onOpen} />
          ))}
        </div>
      )}

      {list.length > 6 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-[.82em] font-extrabold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          {expanded ? 'Свернуть' : `Показать ещё ${list.length - 6}`}
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </button>
      )}
    </main>
  );
};

export default CaseGrid;