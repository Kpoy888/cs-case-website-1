import Icon from '@/components/ui/icon';
import { CategoryId, categories, cases } from '@/data/nicedrop';

const countFor = (id: CategoryId) =>
  id === 'all' ? cases.length : cases.filter((c) => c.category === id).length;

interface Props {
  active: CategoryId;
  onChange: (id: CategoryId) => void;
  onPromo: () => void;
}

const CategorySidebar = ({ active, onChange, onPromo }: Props) => (
  <aside className="flex min-h-0 flex-col rounded-[var(--hero-radius)] border border-border bg-card p-4 lg:p-[18px_16px]">
    <h2 className="mb-3.5 font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
      Категории
    </h2>

    <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
      {categories.map((c) => {
        const on = c.id === active;
        return (
          <li key={c.id}>
            <button
              onClick={() => onChange(c.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[.95em] font-bold transition-colors ${
                on
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon name={c.icon} size={16} className="shrink-0" />
              <span className="truncate">{c.label}</span>
              <span
                className={`ml-auto text-[.78em] font-extrabold ${
                  on ? 'opacity-70' : 'opacity-80'
                }`}
              >
                {countFor(c.id)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>

    <div className="promo-card mt-6 rounded-2xl border border-primary/30 p-4 lg:mt-auto">
      <b className="mb-1.5 block font-display text-[1.25em] leading-none tracking-[.02em] text-primary">
        +15% к пополнению
      </b>
      <p className="text-[.8em] font-bold leading-[1.35] text-muted-foreground">
        Первое пополнение от 300 ₽ — бонус на баланс сразу.
      </p>
      <button
        onClick={onPromo}
        className="mt-3 block w-full rounded-[10px] border border-dashed border-primary/55 p-2 text-center font-display text-[1em] tracking-[.14em] text-foreground transition-colors hover:bg-primary/10"
      >
        NICE15
      </button>
    </div>
  </aside>
);

export default CategorySidebar;